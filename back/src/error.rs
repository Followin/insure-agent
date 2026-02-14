use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

pub enum AppError {
    Internal(anyhow::Error),
    Status(StatusCode, Option<String>),
}

impl AppError {
    pub fn not_found() -> Self {
        Self::Status(StatusCode::NOT_FOUND, None)
    }

    pub fn bad_request() -> Self {
        Self::Status(StatusCode::BAD_REQUEST, None)
    }

    pub fn status(code: StatusCode, message: impl Into<String>) -> Self {
        Self::Status(code, Some(message.into()))
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Internal(err) => {
                tracing::error!("{:?}", err);
                StatusCode::INTERNAL_SERVER_ERROR.into_response()
            }
            AppError::Status(code, None) => code.into_response(),
            AppError::Status(code, Some(msg)) => (code, msg).into_response(),
        }
    }
}

impl<E: Into<anyhow::Error>> From<E> for AppError {
    fn from(err: E) -> Self {
        Self::Internal(err.into())
    }
}

pub type AppResult<T> = Result<T, AppError>;
