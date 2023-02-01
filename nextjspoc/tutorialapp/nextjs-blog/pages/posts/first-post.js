import Link from 'next/link';

export default function FirstPost() {
    return (
        <>
        <main className="nhsuk-main-wrapper" id="maincontent" role="main">
            <div className='nhsuk-action-link'><span className="nhsuk-action-link__text">First Post</span>
            <h2>
                <Link href="/">Back to home</Link>
            </h2>
            </div>
        </main>
        </>);
}