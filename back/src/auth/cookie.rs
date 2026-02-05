use base64::{Engine, engine::general_purpose::STANDARD};
use serde::{Deserialize, Serialize};
use tower_cookies::{Cookie, Cookies};

pub const AUTH_COOKIE_NAME: &str = "auth_session";
const COOKIE_MAX_AGE_DAYS: i64 = 7;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthSession {
    pub access_token: String,
    pub refresh_token: String,
    pub email: String,
    pub expires_at: i64,
}

impl AuthSession {
    pub fn new(access_token: String, refresh_token: String, email: String, expires_in: i64) -> Self {
        let expires_at = chrono::Utc::now().timestamp() + expires_in;
        Self {
            access_token,
            refresh_token,
            email,
            expires_at,
        }
    }

    pub fn is_access_token_expired(&self) -> bool {
        chrono::Utc::now().timestamp() >= self.expires_at
    }

    pub fn to_cookie_value(&self) -> String {
        let json = serde_json::to_string(self).unwrap();
        STANDARD.encode(json.as_bytes())
    }

    pub fn from_cookie_value(value: &str) -> Option<Self> {
        let decoded = STANDARD.decode(value).ok()?;
        let json = String::from_utf8(decoded).ok()?;
        serde_json::from_str(&json).ok()
    }
}

pub fn set_auth_cookie(cookies: &Cookies, session: &AuthSession, secure: bool) {
    let value = session.to_cookie_value();
    let mut cookie = Cookie::new(AUTH_COOKIE_NAME, value);
    cookie.set_http_only(true);
    cookie.set_secure(secure);
    cookie.set_same_site(tower_cookies::cookie::SameSite::Lax);
    cookie.set_max_age(tower_cookies::cookie::time::Duration::days(COOKIE_MAX_AGE_DAYS));
    cookie.set_path("/");
    cookies.add(cookie);
}

pub fn get_auth_session(cookies: &Cookies) -> Option<AuthSession> {
    cookies
        .get(AUTH_COOKIE_NAME)
        .and_then(|c| AuthSession::from_cookie_value(c.value()))
}

pub fn clear_auth_cookie(cookies: &Cookies) {
    let mut cookie = Cookie::new(AUTH_COOKIE_NAME, "");
    cookie.set_path("/");
    cookie.set_max_age(tower_cookies::cookie::time::Duration::seconds(0));
    cookies.remove(cookie);
}
