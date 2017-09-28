import React from 'react';

import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import Button from 'material-ui/Button';
import Tabs, { Tab } from 'material-ui/Tabs';
import AppBar from 'material-ui/AppBar';
import AddIcon from 'material-ui-icons/Add';
import TextField from 'material-ui/TextField';
import Drawer from 'material-ui/Drawer';
import Toolbar from 'material-ui/Toolbar';
import { FormLabel } from 'material-ui/Form';
import Menu, { MenuItem } from 'material-ui/Menu';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import Input from 'material-ui/Input';


import CloseIcon from 'material-ui-icons/Close';
import RoomServiceIcon from 'material-ui-icons/RoomService';

import InputField from 'components/Form/input-field';
import SelectField from 'components/Form/select-field';
import RadioField from 'components/Form/radio-field';

import { observer, observable, inject } from 'mobx-react';
import validatorjs from 'validatorjs';
import MobxReactForm from 'mobx-react-form';

import styles from './style.module.css';

import { graphql, gql } from 'react-apollo';

@inject("store") @observer

export default class CreateDrawer extends React.Component {

    constructor(props){
        super(props)
    }

    handleToggleDrawer(){
        this.props.handleToggleDrawer()
    }

    render() {
        const { drawer } = this.props.store.app;
        var component = "";

        if(drawer.component != null){
            component = drawer.component()
        }

        console.log(drawer)

        
        console.log("HELLOOOOO")
        return (
            <Drawer
            type="persistent"
            anchor="right"
            classes={{
                paper: styles.list,
            }}
            open={drawer.open}
            >
            {component}
            </Drawer>
        )
    }
}