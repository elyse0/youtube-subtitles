FROM node:14 as ts-remover
WORKDIR /usr/app
COPY dist ./
COPY package.json ./
COPY youtube-dl ./
RUN npm install --only=production

FROM nikolaik/python-nodejs:python3.10-nodejs14
WORKDIR /usr/app
COPY --from=ts-remover /usr/app ./
USER 0
EXPOSE ${PORT}
CMD ["node", "index.js"]
