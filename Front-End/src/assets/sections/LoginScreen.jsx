import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Form, Button, Row, Col, Container, Alert } from 'react-bootstrap' 
import axios from 'axios'
import API from '../../api' 

const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) 
  const navigate = useNavigate()
  const location = useLocation()

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (localStorage.getItem('userInfo')) {
      navigate(redirect)
    }
  }, [navigate, redirect])

  const submitHandler = async (e) => {
    e.preventDefault() 
    setLoading(true)
    setError('')

    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      }

      const { data } = await axios.post(
        API.LOGIN,
        {
          username: email,
          password: password,
        },
        config
      )

      localStorage.setItem('userInfo', JSON.stringify(data))

      navigate(redirect)
      
    } catch (error) {
      setError(
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message
      )
    } finally {
        setLoading(false)
    }
  }

  return (
    <Container>
      <Row className='justify-content-md-center'>
        <Col xs={12} md={6}>
          <h1 className="my-3">log in</h1>
          
          {error && <Alert variant='danger'>{error}</Alert>}
          
          {loading && <Alert variant='info'>جاري التحميل...</Alert>}

          <Form onSubmit={submitHandler}>
            <Form.Group controlId='email'>
              <Form.Label> user name : (Username)</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter username'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-3"
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='password'>
              <Form.Label>password</Form.Label>
              <Form.Control
                type='password'
                placeholder='Enter password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-3"
              ></Form.Control>
            </Form.Group>

            <Button type='submit' variant='primary' className='w-100'>
              log in
            </Button>
          </Form>

          <Row className='py-3'>
            <Col>
              Don't have an account?{' '}
              <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
                Register now
              </Link>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}

export default LoginScreen