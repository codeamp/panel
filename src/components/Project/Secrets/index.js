import React from 'react';
import SecretsPaginator from './paginator';
import { observer, inject } from 'mobx-react';

@inject("store") @observer

export default class Secrets extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      limit: props.limit || this.props.store.app.paginator.limit,
      page: 0
    }

    // check url query params
    if(this.props.history.location.search !== ""){
      const searchParams  = new URLSearchParams(this.props.history.location.search)
      let limit           = parseInt(searchParams.get("limit"), 10) || this.state.limit
      let page            = parseInt(searchParams.get("page"), 10) || this.state.page
      if (page < 1){
        page = 1
      }   

      if(limit < 1){
        limit = this.state.limit
      }   

      this.props.history.push({
        pathname: this.props.location.pathname,
        search: '?page=' + page + "&limit=" + limit
      })

      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.page = page - 1

      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.limit = limit
    }
  }


  setNextPage(totalPages){
    let limit = this.state.limit
    let page = this.state.page + 1
    if (page >= totalPages) {
      return
    }

    this.setState({page: page, limit: limit})

    this.props.history.push({
      pathname: this.props.location.pathname,
      search: '?page=' + (page+1) + "&limit=" + this.state.limit
    })
  }

  setPreviousPage(){
    let limit = this.state.limit
    let page = this.state.page - 1
    if (page < 0) {
      return
    }    

    this.setState({page: page, limit: limit})

    this.props.history.push({
      pathname: this.props.location.pathname,
      search: '?page=' + (page+1) + "&limit=" + this.state.limit
    })
  }

  handleOutOfBounds(maxPage, limit){
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: '?page=' + maxPage + "&limit=" + limit
    })

    this.setState({page:maxPage-1, limit:limit})
  }

  render() {
    return (
        <SecretsPaginator 
          handleBackButtonClick={this.setPreviousPage.bind(this)}
          handleNextButtonClick={this.setNextPage.bind(this)}
          handleOutOfBounds={this.handleOutOfBounds.bind(this)}
          history={this.props.history}
          match={this.props.match}
          environment={this.props.environment}
          {...this.state}
          /> 
    )
  }
}
