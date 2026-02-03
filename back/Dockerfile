FROM rust:bullseye AS build
WORKDIR /app

RUN --mount=type=secret,id=certs,target=/tmp/ca-certificates.crt \
    cat /tmp/ca-certificates.crt >> /etc/ssl/certs/ca-certificates.crt

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY src src
COPY .sqlx .sqlx
ENV SQLX_OFFLINE=true
RUN touch src/main.rs && cargo build --release

FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y libssl1.1 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/back /back

ENV BIND_ADDRESS=0.0.0.0:80
EXPOSE 80 443
ENTRYPOINT ["/back"]
