use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_cookies::Cookies;

use super::cookie::{clear_auth_cookie, get_auth_session, set_auth_cookie, AuthSession};
use super::google::GoogleOAuthClient;

#[derive(Debug, Deserialize)]
pub struct CallbackRequest {
    code: String,
    redirect_uri: String,
}

#[derive(Debug, Serialize)]
pub struct CallbackResponse {
    email: String,
}

#[derive(Debug, Serialize)]
pub struct MeResponse {
    email: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    error: String,
}

pub fn router<S>() -> Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    Router::new()
        .route("/auth/callback", post(callback))
        .route("/auth/me", get(me))
        .route("/auth/logout", post(logout))
}

async fn callback(
    cookies: Cookies,
    Json(payload): Json<CallbackRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    let google_client = GoogleOAuthClient::from_env();

    // Exchange code for tokens
    let token_response = google_client
        .exchange_code(&payload.code, &payload.redirect_uri)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse { error: e }),
            )
        })?;

    // Get user info
    let user_info = google_client
        .get_user_info(&token_response.access_token)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse { error: e }),
            )
        })?;

    // Create session
    let refresh_token = token_response.refresh_token.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "No refresh token received. Make sure to request offline access.".to_string(),
            }),
        )
    })?;

    let session = AuthSession::new(
        token_response.access_token,
        refresh_token,
        user_info.email.clone(),
        token_response.expires_in,
    );

    // Set cookie
    let secure = std::env::var("SECURE_COOKIES")
        .map(|v| v == "true")
        .unwrap_or(false);
    set_auth_cookie(&cookies, &session, secure);

    Ok(Json(CallbackResponse {
        email: user_info.email,
    }))
}

async fn me(cookies: Cookies) -> Result<Json<MeResponse>, StatusCode> {
    let session = get_auth_session(&cookies).ok_or(StatusCode::UNAUTHORIZED)?;

    Ok(Json(MeResponse {
        email: session.email,
    }))
}

async fn logout(cookies: Cookies) -> impl IntoResponse {
    clear_auth_cookie(&cookies);
    StatusCode::OK
}
