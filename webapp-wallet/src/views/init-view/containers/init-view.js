import React, { Component } from "react";
import { Container, Header, Divider, Message} from 'semantic-ui-react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { handleLoadFiles } from '../../../state/general/actions';

import ModalImport from '../components/modal-import';
import ButtonGroupInit from '../components/button-group-init';
import { FILES, FILE_STATE } from '../../../constants';

class InitView extends Component {

  state = {
    open: false,
    wallet: '',
    config: '',
    abi: '',
    abiTokens: '',
    ok: FILE_STATE.EMPTY,
  }

  componentWillUnmount() {
    if(this.state.ok === FILE_STATE.UPLOADED){
      this.props.handleLoadFiles(this.state.wallet, this.state.config, this.state.abiRollup, this.state.abiTokens);
    }
  }

  handleClick = async () => {
    if (this.state.wallet === '' || this.state.config === '' || this.state.abiRollup === '') {
      console.log("Incorrect File");
      this.setState({ok: FILE_STATE.ERROR});
    } else {
      this.setState({ok: FILE_STATE.UPLOADED});
    }
    this.setState({ open: false });
  }

  handleChange = (e, id) => {
    e.preventDefault();
    const files = e.target.files;
    if(id === FILES.WALLET) {
      this.setState({wallet: files[0]});
    } else if (id === FILES.CONFIG) {
      this.setState({config: files[0]});
    } else if (id === FILES.ABI) {
      this.setState({abiRollup: files[0]});
    } else if (id === FILES.ABI_TOKENS) {
      this.setState({abiTokens: files[0]});
    }
  }

  renderRedirect = () => {
    if(this.state.ok === FILE_STATE.UPLOADED) {
      return <Redirect to='/actions' />
    }
  }
  
  toggleModal = () => {this.setState(prev => ({ open: !prev.open }))}
  
  render(){
    let messages;
    if(this.state.ok === FILE_STATE.ERROR || this.props.errorFiles !== '') {
      messages = 
      <Container>
        <Message negative> Error </Message>
      </Container>
    } else if(this.state.ok === FILE_STATE.EMPTY){
      messages = "";
    }
    return (
      <Container textAlign='center'>
        {messages}
        <Header
          as='h1'
          style={{
            fontSize: '4em',
            fontWeight: 'normal',
            marginBottom: 0,
            marginTop: '3em',
          }}
        >Rollup</Header>
        <Divider/>
        <ButtonGroupInit
          toggleModal = {this.toggleModal}
        />
        <ModalImport
          open = {this.state.open}
          toggleModal = {this.toggleModal}
          handleChange = {this.handleChange}
          handleClick = {this.handleClick}
          renderRedirect = {this.renderRedirect}
        />
        {this.renderRedirect()}
      </Container>
    );
  }
}

export default connect(null, { handleLoadFiles })(InitView);