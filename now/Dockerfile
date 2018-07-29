FROM node:8.11.3

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
WORKDIR bundle/programs/server
RUN npm install --production
WORKDIR ../..

ENV PORT=3000
EXPOSE 3000
CMD ["node", "main.js"]
