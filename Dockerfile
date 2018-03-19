# base image
FROM node:9.2

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
