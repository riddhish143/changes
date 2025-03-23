// frontend/src/components/SectionTiles.jsx
import React from 'react';
import { Grid, Column, Tile, TextArea } from '@carbon/react';

const SectionTiles = ({
  importantText,
  setImportantText,
  announcementText,
  setAnnouncementText,
}) => {
  return (
    <div style={{ width: '100%' }}>
      <Grid
        fullWidth
        style={{
          paddingLeft: '0',
          paddingRight: '0',
          '--cds-grid-gutter-end': '0', // Override the grid gutter end
          '--cds-grid-gutter': '0', // Override the grid gutter to remove all spacing between columns
          margin: '0px',
        }}
      >
        <Column
          lg={8} // 8 out of 16 columns for large screens (side by side)
          md={8} // 8 out of 8 columns for medium screens (side by side)
          sm={2} // 2 out of 4 columns for small screens (side by side)
          style={{
            paddingLeft: '0',
            paddingRight: '0',
          }}
        >
          <Tile
            style={{
              backgroundColor: '#ffffff',
              margin: '0',
              padding: '16px',
              paddingLeft: '0',
              paddingRight: '0',
              paddingBottom: '0px',
              boxSizing: 'border-box',
            }}
          >
            <h5>Important Section</h5>
            <TextArea
              id="important-section" // Unique ID
              placeholder='Enter your important text here...'
              value={importantText}
              onChange={(e) => setImportantText(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                resize: 'none',
                border: '1px solid #000000',
                boxSizing: 'border-box',
                backgroundColor: 'white',
              }}
            />
          </Tile>
        </Column>
        
        <Column
          lg={8} // 8 out of 16 columns for large screens (side by side)
          md={8} // 8 out of 8 columns for medium screens (side by side)
          sm={2} // 2 out of 4 columns for small screens (side by side)
          style={{
            paddingLeft: '0',
            paddingRight: '0',
          }}
        >
          <Tile
            style={{
              backgroundColor: '#ffffff',
              margin: '0',
              padding: '16px',
              paddingLeft: '16px',
              paddingRight: '0px',
              paddingBottom: '0px',
              boxSizing: 'border-box',
            }}
          >
            <h5>Announcement Section</h5>   
            <TextArea
              id="announcement-section" // Unique ID
              placeholder='Enter your announcement here...'
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                resize: 'none',
                border: '1px solid #000000',
                boxSizing: 'border-box',
                color: 'black',
                backgroundColor: 'white',
              }}
            />
          </Tile>
        </Column>
      </Grid>
    </div>
  );
};

export default SectionTiles;