import React from 'react';
import { GeoMapProvider, useGeoMap } from './context/GeoMapContext';
import { OFFICIAL_ATTRIBUTION } from './data/geomapData';
import { PortalHeader } from './components/PortalHeader';
import { AuthModal } from './components/AuthModal';
import { InteractiveMapView } from './views/InteractiveMapView';
import { CatalogView } from './views/CatalogView';
import { PreviewView } from './views/PreviewView';
import { FaqView } from './views/FaqView';

const AppShell: React.FC = () => {
  const { route, darkMode, basemap, isInstantKeyMode } = useGeoMap();
  const isSatOnMap = route === 'map' && basemap === 'sat';

  return (
    <div
      data-instant={isInstantKeyMode ? 'true' : 'false'}
      className={[
        'geomap-stage min-h-screen flex flex-col',
        darkMode ? 'is-dark' : '',
        isSatOnMap ? 'is-sat' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <PortalHeader />

      <div key={route} className="flex-1 gm-blur-swap">
        {route === 'map' && <InteractiveMapView />}
        {route === 'catalog' && <CatalogView />}
        {route === 'preview' && <PreviewView />}
        {route === 'faq' && <FaqView />}
      </div>

      {route !== 'map' && (
        <footer
          className="border-t px-4 py-4 text-center text-xs"
          style={{
            backgroundColor: 'var(--s-bg-surface)',
            borderColor: 'var(--s-border-subtle)',
            color: 'var(--s-text-muted)',
          }}
        >
          <p>{OFFICIAL_ATTRIBUTION}</p>
        </footer>
      )}

      <AuthModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GeoMapProvider>
      <AppShell />
    </GeoMapProvider>
  );
};

export default App;

