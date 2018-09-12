import React from 'react';
import { observer, inject } from 'mobx-react';
import { Query } from 'react-apollo';

@inject("store") @observer

export default class Paginator extends React.Component { 
  constructor(props){
    super(props)

    this.state = {
    	limit: props.limit || this.props.store.app.paginator.limit || 7,
      page: props.page || 0,
      totalPages: null,
    }
  }

  onClickPreviousPage() {
    let limit = this.state.limit
    let page = this.state.page - 1
    if (page < 0) {
      return
    }    

    this.setState({page: page, limit: limit})
    if (this.props.onPageChanged) {
      this.props.onPageChanged(page, this.state.limit)    
    }
  }

  onClickNextPage() {
    let page = this.state.page + 1
    if (page >= this.state.totalPages) {
      return
    }

    this.setState({page: page, limit: this.state.limit})
    if (this.props.onPageChanged){
      this.props.onPageChanged(page, this.state.limit)
    }
  }

  handlePageOutOfBounds(data) {  
    if(this.props.countPages){
      let maxPage = this.props.countPages(data, this.state.limit)
      if (this.state.page > maxPage) {
        
        this.setState({page: maxPage-1, totalPages: maxPage})
        if(this.props.onPageChanged) {
          this.props.onPageChanged(maxPage-1, this.state.limit)
          return true
        }
      }      
    }

    return false
  }

  handleOnCompleted(data){
    let outOfBounds = this.handlePageOutOfBounds(data)
    if (outOfBounds) {
      return
    }

    if(this.props.countPages){
      let pages = this.props.countPages(data, this.state.limit)
      this.setState({totalPages: pages})
    }

    if (this.props.onCompleted){
      this.props.onCompleted(data)
    }
  }

  render() {
  	const { query, variables } = this.props

  	let params = {
  		page: this.state.page,
  		limit: this.state.limit
  	}

  	let queryVariables = {params: params, ...variables}
  	return (
			<Query query={query} fetchPolicy="network-only" variables={queryVariables} onCompleted={this.handleOnCompleted.bind(this)} onError={this.props.onError}>
  			{ ({loading, error, data}) => {
					return (
            <div>
              {this.props.render(loading, data, error)}
              {this.props.renderControls && this.props.renderControls(loading, this.onClickPreviousPage.bind(this), this.onClickNextPage.bind(this), data, this.state.page, this.state.totalPages)}
            </div>
          )
  			}}
			</Query>
		)
	}
}