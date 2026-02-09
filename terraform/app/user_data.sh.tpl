#!/bin/bash
echo 'export TERM=ansi' >> /etc/profile.d/term.sh
yum update -y
yum install -y docker nginx pip
systemctl start docker
systemctl enable docker

# Install certbot
pip install certbot

# Obtain Let's Encrypt certificates (standalone mode, nginx not yet running)
certbot certonly --standalone --non-interactive --agree-tos \
  --email ${email} \
  -d ${domain} \
  -d ${api_domain}

# Create shared Docker network
docker network create app

# Docker Hub login + pull both images
echo "${dockerhub_token}" | docker login --username dlike --password-stdin
docker pull ${front_image}
docker pull ${back_image}

# Run front container (plain HTTP on internal port 3000)
docker run -d --restart always --name frontend \
  --network app \
  -p 3000:80 \
  ${front_image}

# Run back container (plain HTTP on internal port 8000, no TLS)
docker run -d --restart always --name backend \
  --network app \
  -p 8000:80 \
  -e BIND_ADDRESS=0.0.0.0:80 \
  -e DATABASE_URL=${database_url} \
  ${back_image}

# Nginx reverse proxy config
cat > /etc/nginx/conf.d/apps.conf << 'NGINX'
${nginx_conf}
NGINX

rm -f /etc/nginx/conf.d/default.conf
systemctl start nginx
systemctl enable nginx

# Cert renewal systemd units
cat > /etc/systemd/system/certbot-renew.service << 'EOF'
${certbot_renew_service}
EOF

cat > /etc/systemd/system/certbot-renew.timer << 'EOF'
${certbot_renew_timer}
EOF

systemctl daemon-reload
systemctl enable --now certbot-renew.timer

# Docker auto-update script and systemd units
cat > /usr/local/bin/docker-auto-update.sh << 'EOF'
${docker_auto_update_script}
EOF

chmod +x /usr/local/bin/docker-auto-update.sh

cat > /etc/systemd/system/docker-auto-update.service << 'EOF'
${docker_auto_update_service}
EOF

cat > /etc/systemd/system/docker-auto-update.timer << 'EOF'
${docker_auto_update_timer}
EOF

systemctl daemon-reload
systemctl enable --now docker-auto-update.timer
