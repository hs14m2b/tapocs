import Link from "next/link";
export default function Nav() {
    return (
        <>
        <nav className="nhsuk-breadcrumb" aria-label="Breadcrumb">
          <div className="nhsuk-width-container">
            <ol className="nhsuk-breadcrumb__list">
              <li className="nhsuk-breadcrumb__item"><Link href="/home" className="nhsuk-breadcrumb__link">Home</Link></li>
            </ol>
            <p className="nhsuk-breadcrumb__back"><Link className="nhsuk-breadcrumb__backlink" href="/home">Back to Home</Link></p>
          </div>
        </nav>
        </>
    )
};

