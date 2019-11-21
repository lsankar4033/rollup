import React,{Component} from 'react';
import { Container, Header, Divider, Button } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import ModalImport from '../components/modal-import';
import ModalCreate from '../components/modal-create';

import * as rollup from '../../../utils/bundle-cli';
import { handleLoadWallet, handleLoadFiles, handleLoadOperator } from '../../../state/general/actions';
const FileSaver = require('file-saver');

const config = require('../../../test/config.json');
const abiRollup = require('../../../test/rollupabi.json');
const abiTokens = require('../../../test/tokensabi.json');

class InitView extends Component {

    constructor(props) {
      super(props);
      this.passwordRef = React.createRef();
      this.fileNameRef = React.createRef();
      this.state = {
        isLoaded: false,
        modalImport: false,
        modalCreate: false,
        walletImport: '',
        password: '',
      }
    }

    componentDidUpdate = () => {
      if(this.props.isLoadingWallet === false && this.props.wallet !== '') {
        this.setState({isLoaded: true, modalImport: false});
      }
    }

    handleChangeWallet = (e) => {
      e.preventDefault();
      const files = e.target.files;
      this.setState({walletImport: files[0]});
    }

    handleClickImport = async () => {
      try {
        if(this.state.walletImport === '' || this.passwordRef.current.value === '') {
          console.log(this.passwordRef.current.value)
          throw new Error("Incorrect wallet or password");
        } else {
          this.props.handleLoadWallet(this.state.walletImport, this.passwordRef.current.value);
          this.props.handleLoadFiles(config, abiRollup, abiTokens);
          this.props.handleLoadOperator(config);
        }
      } catch (err) {
        console.log(err.message);
      }
    }

    handleClickCreate = async () => {
      const walletName = this.fileNameRef.current.value;
      const password = this.passwordRef.current.value;

      const wallet = await rollup.wallet.Wallet.createRandom();
      const encWallet = await wallet.toEncryptedJson(password);
      const blob = new Blob([JSON.stringify(encWallet)], { type: 'text/plain;charset=utf-8' });
      FileSaver.saveAs(blob, walletName);
      this.setState({ modalCreate: false })
    }

    toggleModalImport = () => {this.setState(prev => ({ modalImport: !prev.modalImport }))}
    toggleModalCreate = () => {this.setState(prev => ({ modalCreate: !prev.modalCreate }))}

    renderRedirect = () => {
      if(this.state.isLoaded === true) {
        return <Redirect to='/actions' />
      }
    }

    render() {
        return (
          <Container textAlign='center'>
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
            <Button.Group vertical>
              <Button content='Create New Rollup Wallet' icon='plus' size='massive' color='blue'
                onClick={this.toggleModalCreate}
              />
              <Divider/>
              <Button content='Import Rollup Wallet' icon='upload' size='massive' color='violet'
                onClick={this.toggleModalImport}
              />
            </Button.Group>
            <ModalCreate
              modalCreate = {this.state.modalCreate}
              toggleModalCreate = {this.toggleModalCreate}
              handleChangeWallet = {this.handleChangeWallet}
              handleClickCreate = {this.handleClickCreate}
              fileNameRef = {this.fileNameRef}
              passwordRef = {this.passwordRef}
            />
            <ModalImport
              modalImport = {this.state.modalImport}
              toggleModalImport = {this.toggleModalImport}
              handleChangeWallet = {this.handleChangeWallet}
              handleClickImport = {this.handleClickImport}
              passwordRef = {this.passwordRef}
              isLoadingWallet = {this.props.isLoadingWallet}
              errorWallet = {this.props.errorWallet}
            />
            {this.renderRedirect()}
          </Container>
        );
    }
}

const mapStateToProps = state => ({
  isLoadingWallet: state.general.isLoadingWallet,
  wallet: state.general.wallet,
  errorWallet: state.general.errorWallet,
})


export default connect(mapStateToProps, { handleLoadWallet, handleLoadFiles, handleLoadOperator })(InitView);