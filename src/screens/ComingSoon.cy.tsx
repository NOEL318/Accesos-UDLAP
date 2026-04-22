import React from 'react'
import { ComingSoon } from './ComingSoon'

describe('<ComingSoon />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<ComingSoon />)
  })
})