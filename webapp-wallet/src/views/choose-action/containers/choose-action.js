import React,{Component} from 'react';
import { Header, Container, Menu, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import MenuActions from '../components/menu-actions';
import MenuOnchain from '../components/menu-onchain';
import MenuOffchain from '../components/menu-offchain';

class ChooseAction extends Component {
  state = { activeItem: '' }

  handleItemClick = (e, { name }) => {
    e.preventDefault();
    this.setState({ activeItem: name })
  }

  render() {
    let menu;
    if(this.state.activeItem === "onchain") {
      menu = <MenuOnchain />
    } else if (this.state.activeItem === "offchain") {
      menu = <MenuOffchain />
    } else {
      menu = "";
    }
    return (
      <Container textAlign="center">
        <Menu secondary>
          <Menu.Menu position='right'>
            <Link to={'/'}>
              <Menu.Item
                name="initView"
              >
                <Icon name="reply"/>Back
              </Menu.Item>
            </Link>
          </Menu.Menu>
        </Menu>
        <Header
        as='h1'
        style={{
          fontSize: '4em',
          fontWeight: 'normal',
          marginBottom: 0,
          marginTop: '1em',
        }}>
          Choose Action
        </Header>
        <MenuActions 
          handleItemClick = {this.handleItemClick}
          activeItem = {this.state.activeItem}
        />
        {menu}
      </Container>
    )
  }
}
export default ChooseAction;