import React, { Component } from 'react'

class PicSearchPaginate extends Component {

    state = {
        query: "  ",
        pageIndex: 1
    }

    handleSubmit = event => {
        event.preventDefault()
        this.props.fetchSearched(this.state.query, this.state.pageIndex) 
    }



  render() {
    return (
      <div >
        

        <form onSubmit={this.handleSubmit} className="title">
            
            <input placeholder="Title" type="text" value={this.state.query} className="search" onChange={event => this.setState({
                query: event.target.value, pageIndex: 1
            })}
            />
            
        </form>

      </div>
    )
  }

}

export default PicSearchPaginate