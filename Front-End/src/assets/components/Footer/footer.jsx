import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

const Footer = () => {
  return (
    <footer>
      <Container className="mt-5">
        <Row>
          <Col className="text-center py-3">
            <p>Smart-Shop &copy; {new Date().getFullYear()}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer