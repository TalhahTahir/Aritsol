import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { useContent } from '../content/store';
import { listNames } from '../content/words';
import PageHeader from '../components/PageHeader.jsx';
import ProductList from '../components/ProductList.jsx';
import CTABand from '../components/CTABand.jsx';
import s from './Products.module.css';

export default function Products() {
  const { products } = useContent();
  usePageMeta({
    title: 'Products',
    description: `${listNames(products.map((p) => p.name))}: SaaS products built and run by ARTISOL.`,
    path: '/products',
  });

  return (
    <>
      <PageHeader
        title="Our products"
        intro="We build our own SaaS products with the same team and standards we bring to client work. Each product has its own website with plans and sign-up."
      />
      <section className="container">
        <ProductList detailed />
      </section>

      <section className="section">
        <div className={`container ${s.aside}`}>
          <h2 className={s.asideTitle}>Want a product like these for your business?</h2>
          <p className="lede">
            The work behind our products — multi-tenant SaaS, AI pipelines, store integrations — is what we build for
            clients too.
          </p>
          <Link to="/services/saas-product-development" className="link">
            See SaaS & Product Development
          </Link>
        </div>
      </section>

      <CTABand />
    </>
  );
}
