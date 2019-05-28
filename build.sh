docker run --name meteor-apm-server \
  -p 4000:80 \
  -p 7007:7007 \
  -p 11011:11011 \
  -e PORT=80 \
  -e MONGO_URL=mongodb://[your mongodb url] \
  -e MONGO_OPLOG_URL=mongodb://[your mongodb oplog url] \
  -e ROOT_URL=[e.g. monitoring.yourdomain.com] \
  heroku/heroku:16-build