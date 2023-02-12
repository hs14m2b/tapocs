import '../styles/css/nhsuk-6.1.2.min.css';
import '../styles/css/nhsuk-loader.css';
import '../styles/css/nhsuk-hidden.css';
import '../styles/css/nhsuk-input-error.css';

import Layout from '../components/layout';

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}