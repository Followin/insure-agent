use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};
use tower_cookies::Cookies;
use tracing::Span;

use super::cookie::{AuthSession, get_auth_session, set_auth_cookie};
use super::google::GoogleOAuthClient;

#[derive(Clone)]
pub struct HttpSpan(pub Span);

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub email: String,
}

pub async fn store_http_span_middleware(mut request: Request, next: Next) -> Response {
    request.extensions_mut().insert(HttpSpan(Span::current()));
    next.run(request).await
}

pub async fn auth_middleware(
    cookies: Cookies,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let path = request.uri().path();

    // Skip auth for auth routes
    if path.starts_with("/auth/callback") || path.starts_with("/auth/logout") {
        return Ok(next.run(request).await);
    }

    let session = get_auth_session(&cookies).ok_or(StatusCode::UNAUTHORIZED)?;

    // Check if access token is expired and needs refresh
    let session = if session.is_access_token_expired() {
        let google_client = GoogleOAuthClient::from_env();
        let token_response = google_client
            .refresh_access_token(&session.refresh_token)
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        let new_session = AuthSession::new(
            token_response.access_token,
            token_response
                .refresh_token
                .unwrap_or(session.refresh_token),
            session.email.clone(),
            token_response.expires_in,
        );

        // Update cookie with new tokens
        let secure = std::env::var("SECURE_COOKIES")
            .map(|v| v == "true")
            .unwrap_or(false);
        set_auth_cookie(&cookies, &new_session, secure);

        new_session
    } else {
        session
    };

    if let Some(http_span) = request.extensions().get::<HttpSpan>() {
        http_span.0.record("user_email", &session.email);
    }

    request.extensions_mut().insert(AuthUser {
        email: session.email,
    });

    Ok(next.run(request).await)
}

pub async fn allowed_users_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let path = request.uri().path();

    if path.starts_with("/auth/callback") || path.starts_with("/auth/logout") {
        return Ok(next.run(request).await);
    }

    let user = request.extensions().get::<AuthUser>();

    if let Some(user) = user
        && (user.email == "dlike.version10@gmail.com"
            || user.email == "yerig68@gmail.com"
            || user.email == "ieremenko68@gmail.com")
    {
        Ok(next.run(request).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
