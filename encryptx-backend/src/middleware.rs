//! Security middleware for EncryptX backend
//!
//! This module implements security headers middleware that automatically adds
//! essential security headers to all HTTP responses. These headers help protect
//! against common web vulnerabilities and improve the overall security posture.
//!
//! # Security Headers Applied
//! - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
//! - `X-Frame-Options: DENY` - Prevents clickjacking attacks
//! - `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
//! - `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
//! - `Content-Security-Policy: default-src 'none'` - Restrictive CSP for API
//! - `Strict-Transport-Security` - HTTPS enforcement (when using HTTPS)
//!
//! # Usage
//! The middleware is automatically applied to all routes when added to the Actix Web app.
use actix_web::{
    Error,
    dev::{Service, ServiceRequest, ServiceResponse, Transform, forward_ready},
};
use futures_util::future::LocalBoxFuture;
use std::{
    future::{Ready, ready},
    rc::Rc,
};

/// Security headers middleware implementation.
///
/// This struct implements the Actix Web `Transform` trait to automatically add
/// security headers to all HTTP responses. It's designed to be lightweight and
/// applied globally to all routes.
pub struct SecurityHeaders;

impl<S, B> Transform<S, ServiceRequest> for SecurityHeaders
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = SecurityHeadersMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(SecurityHeadersMiddleware {
            service: Rc::new(service),
        }))
    }
}

/// The actual middleware service that processes requests and adds security headers.
///
/// This struct wraps the next service in the middleware chain and adds security
/// headers to responses before returning them to the client.
pub struct SecurityHeadersMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for SecurityHeadersMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            // Check if HTTPS before moving req
            let is_https = req.connection_info().scheme() == "https";

            let mut res = service.call(req).await?;

            // Add security headers
            let headers = res.headers_mut();

            // Prevent MIME type sniffing
            headers.insert(
                actix_web::http::header::HeaderName::from_static("x-content-type-options"),
                actix_web::http::header::HeaderValue::from_static("nosniff"),
            );

            // Prevent clickjacking
            headers.insert(
                actix_web::http::header::HeaderName::from_static("x-frame-options"),
                actix_web::http::header::HeaderValue::from_static("DENY"),
            );

            // XSS protection
            headers.insert(
                actix_web::http::header::HeaderName::from_static("x-xss-protection"),
                actix_web::http::header::HeaderValue::from_static("1; mode=block"),
            );

            // Referrer policy
            headers.insert(
                actix_web::http::header::HeaderName::from_static("referrer-policy"),
                actix_web::http::header::HeaderValue::from_static(
                    "strict-origin-when-cross-origin",
                ),
            );

            // Content Security Policy (restrictive for API)
            headers.insert(
                actix_web::http::header::HeaderName::from_static("content-security-policy"),
                actix_web::http::header::HeaderValue::from_static(
                    "default-src 'none'; frame-ancestors 'none';",
                ),
            );

            // Strict Transport Security (if HTTPS)
            if is_https {
                headers.insert(
                    actix_web::http::header::HeaderName::from_static("strict-transport-security"),
                    actix_web::http::header::HeaderValue::from_static(
                        "max-age=31536000; includeSubDomains",
                    ),
                );
            }

            Ok(res)
        })
    }
}
