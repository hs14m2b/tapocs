import Footer from './footer'
import Header from './header'
import Link from 'next/link';
import Nav from './nav'

export default function Layout({ children }) {
  return (
    <>
        <Header ></Header>  
        <Nav ></Nav>
        <div className="nhsuk-width-container ">
          <main className="nhsuk-main-wrapper " id="maincontent" role="main">
            <div className="nhsuk-grid-row">
              <div className="nhsuk-grid-column-two-thirds">
              {children}
              </div>
            </div>
          </main>
        </div>
        <Footer></Footer>
    </>
  )
}