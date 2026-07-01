#!/bin/sh
npm run build
cp -r /app/dist/viora-clients-frontend/browser/* /usr/share/nginx/html/
exec nginx -g 'daemon off;'
