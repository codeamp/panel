FROM node:9-alpine

ARG PORT=3010
ARG REACT_APP_CIRCUIT_URI=http://localhost:3011
ARG REACT_APP_CIRCUIT_WSS_URI=http://localhost:3011
ARG REACT_APP_DEX_URI=http://localhost:5556
ARG REACT_APP_PANEL_URI=http://localhost:3010
ARG REACT_APP_CLIENT_ID=example-app
ARG REACT_APP_KIBANA_LINK_TEMPLATE="https://kibana-ui.example.net/app/kibana#/discover?_g=(refreshInterval:('$$hashKey':'object:2676',display:'10%20seconds',pause:!f,section:1,value:10000),time:(from:now-15m,mode:quick,to:now))&_a=(columns:!(_source),filters:!(('$$hashKey':'object:1997','$state':(store:appState),meta:(alias:!n,disabled:!f,index:'kubernetes-*',key:kubernetes.namespace,negate:!f,value:##PROJECT-NAMESPACE##),query:(match:(kubernetes.namespace:(query:##PROJECT-NAMESPACE##,type:phrase))))),index:'kubernetes-*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!('@timestamp',desc))"
ARG REACT_APP_KIBANA_RELEASE_TEMPLATE="https://kibana-ui.example.net/app/kibana#/discover?_g=(refreshInterval:('$$hashKey':'object:32711',display:'10%20seconds',pause:!t,section:1,value:10000),time:(from:now-30m,mode:quick,to:now))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'kubernetes-*',key:kubernetes.labels.releaseID,negate:!f,params:(query:'##RELEASE-ID##',type:phrase),type:phrase,value:'##RELEASE-ID##'),query:(match:(kubernetes.labels.releaseID:(query:'##RELEASE-ID##',type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'kubernetes-*',key:kubernetes.namespace,negate:!f,params:(query:'##PROJECT-NAMESPACE##',type:phrase),type:phrase,value:'##PROJECT-NAMESPACE##'),query:(match:(kubernetes.namespace:(query:'##PROJECT-NAMESPACE##',type:phrase))))),index:'kubernetes-*',interval:auto,query:(language:lucene,query:'*'),sort:!('@timestamp',desc))"

ENV PORT=${PORT}   
ENV REACT_APP_CIRCUIT_URI=${REACT_APP_CIRCUIT_URI}
ENV REACT_APP_CIRCUIT_WSS_URI=${REACT_APP_CIRCUIT_WSS_URI}
ENV REACT_APP_DEX_URI=${REACT_APP_DEX_URI}
ENV REACT_APP_PANEL_URI=${REACT_APP_PANEL_URI}
ENV REACT_APP_CLIENT_ID=${REACT_APP_CLIENT_ID}
ENV REACT_APP_KIBANA_LINK_TEMPLATE=${REACT_APP_KIBANA_LINK_TEMPLATE}
ENV REACT_APP_KIBANA_RELEASE_TEMPLATE=${REACT_APP_KIBANA_RELEASE_TEMPLATE}

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
