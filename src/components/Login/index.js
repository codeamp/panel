import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import MobxReactForm from 'mobx-react-form';
import validatorjs from 'validatorjs';
import Button from 'material-ui/Button';
import InputField from 'components/Form/input-field';
import styles from './style.module.css';
import Grid from 'material-ui/Grid';
import Card, { CardActions, CardContent, CardHeader } from 'material-ui/Card';
import { graphql, gql } from 'react-apollo';

const fields = [{
  type: 'email',
  name: 'email',
  label: 'Email',
  placeholder: 'Insert Email',
  rules: 'required|email|string|between:5,25',
}, {
  type: 'password',
  name: 'password',
  label: 'Password',
  placeholder: 'Insert Password',
  rules: 'required|string|between:5,25',
}];

@graphql(gql`
  mutation Mutation($email: String!, $password: String!) {
    userToken(email: $email, password: $password) {
      id
      email
      token 
    }
  }
`)

@inject("store") @observer

class Login extends Component {
  constructor(props) {
    super(props);
    this.onSuccess = this.onSuccess.bind(this);
    this.onError = this.onError.bind(this);
  }

  form = null;

  componentWillMount() {
    const plugins = { dvr: validatorjs };
    this.form = new MobxReactForm({ fields }, { plugins });
  }

  onSuccess(form) {
    if (!form.$('email').error && !form.$('password').error) {
      this.props.mutate({
        variables: form.values(),
      }).then(({data}) => {
        this.props.store.app.setUser(JSON.stringify(data.userToken))
        //this.props.history.push('/')
        window.location.href = '/'
      }).catch(error => {
        //let obj = JSON.parse(JSON.stringify(error))
        form.invalidate(error.message);
      });
    }
  }

  onError(form) {
    // get all form errors
    console.log('All form errors', form.errors());
    // invalidate the form with a custom error message
    form.invalidate('This is a generic error message!');
  }

  render() {
    const form = this.form;

    return (
      <div className={styles.root}>
        <Grid container justify="center">
          <Grid item xs={4}>
            <Card className={styles.container}>
              <CardHeader title="CodeAmp Login"/>
              <form onSubmit={form.onSubmit}>
                <CardContent>
                  <InputField field={form.$('email')} fullWidth={true} />
                  <InputField field={form.$('password')} fullWidth={true} />
                </CardContent>
                <CardActions>
                  <Button type="submit" onClick={e => form.onSubmit(e, { onSuccess: this.onSuccess, onError: this.onError })}>Submit</Button>
                </CardActions>
              </form>
            </Card>
          </Grid>
        </Grid>
      </div>
      );
  }
}

export default Login;
