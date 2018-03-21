FROM node:9-alpine

ARG PORT=3010
ARG REACT_APP_CIRCUIT_URI=http://localhost:3011
ARG REACT_APP_CIRCUIT_WSS_URI=http://localhost:3011
ARG REACT_APP_DEX_URI=http://localhost:5556
ARG REACT_APP_PANEL_URI=http://localhost:3010
ARG REACT_APP_CLIENT_ID=example-app

ENV PORT=${PORT}
ENV REACT_APP_CIRCUIT_URI=${REACT_APP_CIRCUIT_URI}
ENV REACT_APP_CIRCUIT_WSS_URI=${REACT_APP_CIRCUIT_WSS_URI}
ENV REACT_APP_DEX_URI=${REACT_APP_DEX_URI}
ENV REACT_APP_PANEL_URI=${REACT_APP_PANEL_URI}
ENV REACT_APP_CLIENT_ID=${REACT_APP_CLIENT_ID}

# set working directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
ADD package-lock.json /usr/src/app/package-lock.json
RUN npm install
RUN npm install -g serve

ADD . /usr/src/app/
RUN npm run build 

EXPOSE 3010
# start app
CMD ["serve", "-s", "build", "-p", "3010"]
