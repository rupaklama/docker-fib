# build phase-step
# tagging this phase with name builder
FROM node:alpine as builder
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
# build pro files
RUN npm run build

# run phase
# build dir is located inside the current dir - /app/build
FROM nginx
EXPOSE 3000
# overwrite existing nginx's default.con file
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
# to copy build dir & put it inside nginx
COPY --from=builder /app/build /usr/share/nginx/html