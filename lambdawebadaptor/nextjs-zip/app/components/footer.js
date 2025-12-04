import Link from 'next/link';
export default function Footer() {
    return (
        <>
        <footer role="contentinfo">
          <div className="nhsuk-footer" id="nhsuk-footer">
            <div className="nhsuk-width-container">
              <h2 className="nhsuk-u-visually-hidden">Support links</h2>
              <ul className="nhsuk-footer__list">
                <li className="nhsuk-footer__list-item"><Link className="nhsuk-footer__list-item-link" href="/">Home</Link></li>
                <li className="nhsuk-footer__list-item"><Link className="nhsuk-footer__list-item-link" href="/postlist">Example page</Link></li>
              </ul>
              
              <p className="nhsuk-footer__copyright">&copy; Crown copyright</p>
            </div>
          </div>
        </footer>
        </>
    )
}