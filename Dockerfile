FROM node:18.4.0
WORKDIR /app
COPY . .

ENV SECRET='dKq40DY#2QWj'
ENV DOCKERIZE_VERSION v0.6.1
ENV USER=sa
ENV PASSWORD='abcDEF123#'
ENV SERVER=db
ENV PORT=1433
ENV DATABASE=kanongaming

RUN apt-get update -y && \ 
    apt-get install -y wget

RUN npm install

RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

EXPOSE 2002

ENTRYPOINT ["node", "index.js"]