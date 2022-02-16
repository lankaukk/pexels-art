import React, { Component } from 'react';
import PicList from '../components/PicList';
import PicSearchPaginate from '../components/PicSearchPaginate';

// personal api key from .env file securely without sharing to github
const API_KEY = process.env.REACT_APP_API_KEY

class PicListContainer extends Component {

    state = {
        pics: []
    }

    fetchSearched = (query, index) => { 
          const BASE_URL = `https://api.pexels.com/v1/search?query=${query}&page=${index}&per_page=36`

          fetch(BASE_URL, {
          headers: {
            Authorization: API_KEY
          }})
          .then(response => response.json())
          //.then(result => console.log(result.photos))
          .then(result => {
            this.setState({ 
              pics: result.photos.map( pic => ({         
                avg_color: pic.avg_color}) )
              });
            })
          .catch(err => console.log(err))

        // )
        console.log("query:", query, "page:", index)
    }

    
    render() {
        return ( 
        <div >
            <div className='iLikeTo'>I like to call this piece...</div>
            
            <div className='artcontainer'>
              <PicList pics = { this.state.pics }/>  
            </div>

            <PicSearchPaginate fetchSearched = { this.fetchSearched }/> 
        </div>
        )
    }

}


export default PicListContainer