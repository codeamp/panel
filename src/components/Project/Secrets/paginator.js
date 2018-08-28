import React from 'react';
import Loading from 'components/Utils/Loading';
import PanelTable from 'components/Utils/Table';
import { observer, inject } from 'mobx-react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import 'brace/mode/yaml';
import 'brace/theme/github';
import jstz from 'jstimezonedetect';
import moment from 'moment';
import 'moment-timezone';
import LockIcon from 'material-ui-icons/Lock';

@inject("store") @observer
@graphql(gql`
query Project($slug: String, $environmentID: String, $params: PaginatorInput! ){
  project(slug: $slug, environmentID: $environmentID) {
    id
    name
    secrets(params:$params) {
      count
      entries {
        id
        key
        value
        isSecret
        user {
          id
          email
        }
        versions {
          value
          created
          user {
            id
            email
          }
        }
        type
        created
      }
    }
  }
}`, {
  options: (props) => ({
    variables: {
      slug: props.match.params.slug,
      environmentID: props.store.app.currentEnvironment.id,
      params: {
        limit: props.limit || props.store.app.paginator.limit,
        page: props.page || 0,
      },
    }
  })
})

export default class SecretsPaginator extends React.Component { 
  constructor(props){
    super(props)

    this.handleNextButtonClick = this.handleNextButtonClick.bind(this)
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this)
    this.handleOutOfBounds = this.handleOutOfBounds.bind(this)
    this.onClick = this.onClick.bind(this)
    
    this.state = {
      limit: props.limit || this.props.store.app.paginator.limit || 7,
      page: props.page || 0,
    }
  }

  componentDidUpdate(){
      this.handleOutOfBounds()
  }

  handleOutOfBounds(){  
    const { page, limit } = this.props;
    const { loading } = this.props.data
    if (loading) {
      return
    }
    const { count } = this.props.data.project.secrets
    
    let maxPage = Math.ceil(count / limit)
    if ( page > maxPage ){
      this.props.handleOutOfBounds(maxPage, limit)
    }
  }

  handleNextButtonClick() {
    const { project } = this.props.data

    let totalPages = Math.ceil(project.secrets.count / this.props.limit)
    this.props.handleNextButtonClick(totalPages)
  }

  handleBackButtonClick() {
    this.props.handleBackButtonClick()
  }

  onClick(idx) {
    const { project } = this.props.data

    this.props.onClick(project.id, project.secrets.entries[idx], idx)
  }

  render() {
    const { page, limit } = this.props;
    const { loading, project } = this.props.data

    if(loading){
      return (<Loading />)
    }

    return (
      <PanelTable
          title={"Secrets"}
          rows={project.secrets ? project.secrets.entries : []}
          handleBackButtonClick={this.handleBackButtonClick}
          handleNextButtonClick={this.handleNextButtonClick}
          onClick={this.onClick}          
          paginator={{
            count: project.secrets.count,
            page: page,
            limit: limit
          }}
          columns={[{
            label: "Key",
            getVal: function(row){return row.key},
          }, {
            label: "Type",
            getVal: function(row){return row.type},
          }, {
            label: "Protected",
            getVal: function(row){
              if(row.isSecret)
                return (<LockIcon/>)
              return ""
            },
          }, {
            label: "Creator",
            getVal: function(row){return row.user.email},
          }, {
            label: "Created",
            getVal: function(row){return moment(new Date(row.created)).format("ddd, MMM Do, YYYY HH:mm:ss") + " (" + moment.tz(jstz.determine().name()).format('z') + ")"},
          }]}
        />     
    )

  }
}
