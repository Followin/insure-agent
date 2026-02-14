use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct TokenRequest {
    pub code: String,
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
    pub grant_type: String,
}

#[derive(Debug, Serialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
    pub client_id: String,
    pub client_secret: String,
    pub grant_type: String,
}

#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: i64,
}

#[derive(Debug, Deserialize)]
pub struct UserInfo {
    pub email: String,
}

pub struct GoogleOAuthClient {
    client_id: String,
    client_secret: String,
    http_client: reqwest::Client,
}

impl GoogleOAuthClient {
    pub fn from_env() -> Self {
        Self {
            client_id: std::env::var("GOOGLE_CLIENT_ID").expect("GOOGLE_CLIENT_ID must be set"),
            client_secret: std::env::var("GOOGLE_CLIENT_SECRET")
                .expect("GOOGLE_CLIENT_SECRET must be set"),
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn exchange_code(
        &self,
        code: &str,
        redirect_uri: &str,
    ) -> Result<TokenResponse, String> {
        let request = TokenRequest {
            code: code.to_string(),
            client_id: self.client_id.clone(),
            client_secret: self.client_secret.clone(),
            redirect_uri: redirect_uri.to_string(),
            grant_type: "authorization_code".to_string(),
        };

        let response = self
            .http_client
            .post("https://oauth2.googleapis.com/token")
            .form(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to send token request: {}", e))?;

        if !response.status().is_success() {
            let error_body = response.text().await.unwrap_or_default();
            return Err(format!("Token exchange failed: {}", error_body));
        }

        response
            .json::<TokenResponse>()
            .await
            .map_err(|e| format!("Failed to parse token response: {}", e))
    }

    pub async fn refresh_access_token(&self, refresh_token: &str) -> Result<TokenResponse, String> {
        let request = RefreshTokenRequest {
            refresh_token: refresh_token.to_string(),
            client_id: self.client_id.clone(),
            client_secret: self.client_secret.clone(),
            grant_type: "refresh_token".to_string(),
        };

        let response = self
            .http_client
            .post("https://oauth2.googleapis.com/token")
            .form(&request)
            .send()
            .await
            .map_err(|e| format!("Failed to send refresh request: {}", e))?;

        if !response.status().is_success() {
            let error_body = response.text().await.unwrap_or_default();
            return Err(format!("Token refresh failed: {}", error_body));
        }

        response
            .json::<TokenResponse>()
            .await
            .map_err(|e| format!("Failed to parse refresh response: {}", e))
    }

    pub async fn get_user_info(&self, access_token: &str) -> Result<UserInfo, String> {
        let response = self
            .http_client
            .get("https://www.googleapis.com/oauth2/v2/userinfo")
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch user info: {}", e))?;

        if !response.status().is_success() {
            let error_body = response.text().await.unwrap_or_default();
            return Err(format!("User info request failed: {}", error_body));
        }

        response
            .json::<UserInfo>()
            .await
            .map_err(|e| format!("Failed to parse user info: {}", e))
    }
}
