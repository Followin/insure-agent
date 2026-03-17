use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::Rng;
use serde::{Deserialize, Serialize};
use tower_cookies::Cookies;

use super::cookie::{
    clear_auth_cookie, clear_oauth_state_cookie, get_auth_session, get_oauth_state,
    set_auth_cookie, set_oauth_state_cookie, AuthSession,
};
use super::google::GoogleOAuthClient;
use super::middleware::is_allowed_user;

#[derive(Debug, Deserialize)]
pub struct CallbackRequest {
    code: String,
    redirect_uri: String,
    state: String,
}

#[derive(Debug, Serialize)]
pub struct CallbackResponse {
    email: String,
}

#[derive(Debug, Serialize)]
pub struct InitResponse {
    state: String,
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
        .route("/auth/init", get(init))
        .route("/auth/callback", post(callback))
        .route("/auth/me", get(me))
        .route("/auth/logout", post(logout))
}

async fn init(cookies: Cookies) -> Json<InitResponse> {
    let bytes: [u8; 32] = rand::rng().random();
    let state = URL_SAFE_NO_PAD.encode(bytes);

    let secure = std::env::var("SECURE_COOKIES")
        .map(|v| v == "true")
        .unwrap_or(false);
    set_oauth_state_cookie(&cookies, &state, secure);

    Json(InitResponse { state })
}

async fn callback(
    cookies: Cookies,
    Json(payload): Json<CallbackRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    // Verify OAuth state to prevent CSRF
    let stored_state = get_oauth_state(&cookies).ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Missing OAuth state".to_string(),
            }),
        )
    })?;

    if payload.state != stored_state {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Invalid OAuth state".to_string(),
            }),
        ));
    }

    clear_oauth_state_cookie(&cookies);

    let google_client = GoogleOAuthClient::from_env();

    // Exchange code for tokens
    let token_response = google_client
        .exchange_code(&payload.code, &payload.redirect_uri)
        .await
        .map_err(|e| {
            tracing::error!("Token exchange failed: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Token exchange failed".to_string(),
                }),
            )
        })?;

    // Get user info
    let user_info = google_client
        .get_user_info(&token_response.access_token)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get user info: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "Failed to get user info".to_string(),
                }),
            )
        })?;

    // Enforce allowlist at login
    if !is_allowed_user(&user_info.email) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "Access denied".to_string(),
            }),
        ));
    }

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
    let google_client = GoogleOAuthClient::from_env();
    let user_info = google_client
        .get_user_info(&session.access_token)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    Ok(Json(MeResponse {
        email: user_info.email,
    }))
}

async fn logout(cookies: Cookies) -> impl IntoResponse {
    clear_auth_cookie(&cookies);
    StatusCode::OK
}
