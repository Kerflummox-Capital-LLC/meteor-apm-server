FROM abernix/meteord:node-8.9.3-base
ENV NODE_ENV production
WORKDIR /usr/src/app
EXPOSE 3000
EXPOSE 7007
EXPOSE 11011
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
CMD npm start