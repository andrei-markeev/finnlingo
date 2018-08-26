FROM mhart/alpine-node:8.11.4

LABEL name="finnlingo"
ARG HOSTNAME
ARG NOW
ARG NOW_DC
ARG NOW_REGION
ARG NOW_URL

RUN mkdir /app
WORKDIR /app
COPY * /app/

RUN cat finnlingo.* > finnlingo.tar.gz
RUN tar zxf finnlingo.tar.gz
RUN rm finnlingo.*
WORKDIR bundle/programs/server
RUN apk add --no-cache make g++ python
RUN npm install --production
RUN apk del make g++ python
WORKDIR ../..

ENV PORT=3000
EXPOSE 3000
CMD ["node", "main.js"]
