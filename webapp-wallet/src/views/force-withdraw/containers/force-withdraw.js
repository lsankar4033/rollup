import React, { Component } from 'react';
import { Form, Container, Button } from 'semantic-ui-react';
import { forceWithdraw } from '../../../actions/forcewithdraw-metamask';
import * as rollup from '../../../utils/bundle-cli';
import ButtonToActionsView from '../../../base-ui/button-actions-view';

class ForceWithdraw extends Component {
  
  constructor(props) {
    super(props);
    this.amountRef = React.createRef();
    this.passwordRef = React.createRef();
    this.tokenIdRef = React.createRef();
    this.idFromRef = React.createRef();
  }

  handleClick = async () => {

    const { wallet, config, abiRollup } = this.props;

    const amount = parseInt(this.amountRef.current.value);
    const password = this.passwordRef.current.value;
    const idFrom = parseInt(this.idFromRef.current.value);
    const nodeEth = config.nodeEth;
    const addressSC = config.address;
    const res = await rollup.onchain.forceWithdraw.forceWithdraw(nodeEth, addressSC, amount, wallet, password, abiRollup, idFrom);
    console.log(res);
  }

  handleClick2 = async () => {

    const { wallet, config, abiRollup, web3 } = this.props;

    const amount = parseInt(this.amountRef.current.value);
    const password = this.passwordRef.current.value;
    const idFrom = parseInt(this.idFromRef.current.value);
    const nodeEth = config.nodeEth;
    const addressSC = config.address;
    const account = this.props.account;

    const res = await forceWithdraw(nodeEth, addressSC, amount, wallet, password, abiRollup, idFrom, web3, account);
    console.log(res);
  }

  render() {
    return(
      <Container>
        <ButtonToActionsView/>
        <h1>Force Withdraw</h1>
        <Form>
          <Form.Field>
            <label>Amount</label>
            <input type="text" ref={this.amountRef}/>
          </Form.Field>
          <Form.Field>
            <label>Password</label>
            <input type="password" ref={this.passwordRef}/>
          </Form.Field>
          <Form.Field>
            <label>ID From</label>
            <input type="text" ref={this.idFromRef}/>
          </Form.Field>
          <Button type="submit" onClick={this.handleClick}>Force Withdraw</Button>
          <Button type="submit" onClick={this.handleClick2}>Force Withdraw Metamask</Button>
        </Form>
        <br/>
      </Container>
    );
  }
}

export default ForceWithdraw;