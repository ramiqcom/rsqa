// Import module
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Head from 'next/head';
import Script from 'next/script';
import { kml } from '@tmcw/togeojson';
import * as turf from '@turf/turf';
import { Chart } from "react-google-charts";

// Import css
import './_app';

// ** Global variables ** //

// Google Map variables
let Map;
let Data;
let Tile;
let Draw;

// AOI type
let geomType;

// EE image variables
let imageCol;
let startDate;
let endDate;
let dateRangePair;
let cloudFilter;
let cloudMasking;
let bandRed;
let bandGreen;
let bandBlue;

// App variables
let setBandsList;
let setBandRed;
let setBandGreen;
let setBandBlue;
let setLoadingScreen;
let showButtonStatus;
let showRemoveButton;
let SHPFile;
let KMLFile;
let GeoJSONFile;
let setValues;
let setShowChart;
let setDataChart;

// Process variables
let Composite;

// ** Global variables ** //


// ** Helper component ** //

// Dropdown class
function Select(props) {
  const [items, setItems] = useState(props.items);

  useEffect(() => {

  })

  return (

    <select className={props.className} id={props.id} style={props.style} onChange={props.onChange} defaultValue={props.selected}>
    
      <option value="" disabled >{props.placeholder}</option>
      {
        items.map((object, i) => <option value={object} key={i}> {object} </option>)
      }
    </select>

  );
}

// Checkbox class
function Checkbox(props) {
  return (
    <div>
      <input id='check' type='checkbox' checked={props.checked} onChange={props.onChange} style={props.style} className='checkbox' />
      <label htmlFor='check' style={{ margin: '5px 10px' }}>{props.label}</label>
    </div>
  );
}

// Link class
function OpenLink(props){
  return (
    <div>
      <a href={props.href} target={props.target} rel='noreferrer' download={props.download} style={props.style}>
        {props.children}
      </a>
    </div>
  )
}

// ** Helper components ** //


// ** Components ** //

// Main app
export default function Home(props) {
  return (
    <div>
      <Head>
        <title>Remote Sensing Quick Analysis</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />

        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <Script
        type="text/javascript" 
        src="https://www.gstatic.com/charts/loader.js"
      />

			<Script 
				src='https://unpkg.com/leaflet@1.9.3/dist/leaflet.js'
				integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM="
     		crossOrigin=""
				onLoad={leafletMap}
			/>

      <div style={{ height: '99vh', width: '100%' }}>
        <Header />
        <Main />
        <Footer />
      </div>
    </div>
  )
}

// Header
function Header(){
  return (
    <div id='header' className='frame'>
      <div style={{ margin: '0.5%', display: 'flex' }}>
        RAMIQCOM Geospatial Solution
      </div>
    </div>
  )
}

// Header
function Footer(){
  return (
    <div id='footer' className='frame'>
      <div style={{ margin: '0.5%', display: 'flex', alignContent: 'center', justifyContent: 'center'}}>

        <OpenLink href='https://www.linkedin.com/in/ramiqcom/' target='_blank' style={{ color: '#696969' }}>
          LinkedIn
        </OpenLink>

        &nbsp;

        <OpenLink href='https://github.com/ramiqcom' target='_blank' style={{ color: '#696969' }}>
          GitHub
        </OpenLink>
        
      </div>
    </div>
  )
}

// Main panel
function Main() {
  return (
    <div id='main' className='column'>
      <Layer />
      <Box />
      <App />
    </div>
  )
}

// Layer list panel
function Layer() {
  const [show, setShow] = useState('none');
  const [value, setValue] = useState('none');
  const [chartShow, setChartShow] = useState('none');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setLoadingScreen = setShow;
    setValues = setValue;
    setShowChart = setChartShow;
    setDataChart = setChartData;
  }, []);

  return (
    <div style={{ width: '10%', margin: '1%' }}>

      <div style={{ fontSize: 'large', margin: '1% auto 5%', textAlign: 'center' }}>
        Layers
      </div>

      <div style={{ fontWeight: 'bold', color: 'blue', fontSize: 'large', textAlign: 'center', display: show }}>
        Loading...
      </div>

      <div id='layerlist' />

      <div style={{ color: 'blue', display: value, margin: '20% auto auto' }}>Click the image to get values!</div>

      <div style={{ display: chartShow }}>
        <ValuesChart data={chartData}/>
      </div>

    </div>
  )
}

// Value panel
function ValuesChart(props){
  const dict = props.data;
  
  const data = [['Band', 'Value']];
  for (const [key, value] of Object.entries(dict)){
    data.push([key, value/10000]);
  }

  const options = {
    title: "Bands value",
    hAxis: {
      title: "Surface reflectance",
      minValue: 0,
    },
    vAxis: {
      title: "Bands",
    },
  };

  return (
    <div>
      <Chart
        chartType="BarChart"
        width="100%"
        height="400px"
        data={data}
        options={options}
        legendToggle={false}
      />
    </div>
  )
}

// Map section
function Box() {
  return (
    <div id='map' style={{ width: '70%', height: '100%' }}>
    </div>
  )
}

// App panel
function App() {
  const [disabled, setDisabled] = useState(false);
  const [disableRemove, setDisabledRemove] = useState(true);

  useEffect(() => {
    showButtonStatus = setDisabled;
    showRemoveButton = setDisabledRemove;
  }, []);

  // Remove all tile
  function removeTile() {
    Tile.clearLayers();
    setDisabledRemove(true);

    // Delete click action
    clickValues(false);
  }

  return (
    <div id='app' style={{ width: '16%' }}>

      <div style={{ margin: '8%', width: '100%' }}>

        <div id='title' style={{ fontSize: 'xx-large', fontWeight: '400', color: 'navy', margin: 'auto auto 5%' }}>
          Remote Sensing Quick Analysis v.0.3
        </div>

        <Collection />
        <AOISection />
        <DateSlider />
        <CloudSection />
        <Preprocessing />
        <Visualization />

        <button style={{ width: '100%', margin: '5% auto auto', color: 'green' }} disabled={disabled} onClick={showImage} className='action'>
            Show image
        </button>

        <button style={{ width: '100%', margin: '5% auto', color: 'red' }} disabled={disableRemove} onClick={removeTile} className='action'>
            Remove image
        </button>

      </div>
      
    </div>
  )
}

// Collection section
function Collection() {
  const [col, setCol] = useState('Sentinel-2');

  function changeCol(data){
    const status = data.target.options[data.target.selectedIndex].text;

    setCol(status);

    switch (status) {
      case 'Sentinel-2':
        setBandsList(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12']);
        setBandRed('B8');
        setBandGreen('B11');
        setBandBlue('B2');
        break;
      case 'Landsat OLI':
        setBandsList(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']);
        setBandRed('B5');
        setBandGreen('B6');
        setBandBlue('B2');
        break;
      case 'Landsat TM & ETM':
        setBandsList(['B1', 'B2', 'B3', 'B4', 'B5', 'B7']);
        setBandRed('B4');
        setBandGreen('B5');
        setBandBlue('B1');
        break;
      case 'Planetscope':
        setBandsList(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']);
        setBandRed('B6');
        setBandGreen('B7');
        setBandBlue('B8');
        break;
    }
  }

  useEffect(() => {
    imageCol = col;
  })

  return (
    <Select
      items={['Sentinel-2', 'Landsat OLI', 'Landsat TM & ETM', 'Planetscope']}
      placeholder='Select imagery collection'
      style={{ textAlign: 'center', width: '100%' }}
      className='action'
      selected={col}
      onChange={changeCol}
    />
  )
}

// AOI section
function AOISection() {
  // AOI status select value
  const [aoiStatus, setAoiStatus] = useState('Map bounds');

  // Upload section show
  const [uploadSHP, setUploadSHP] = useState('none');
  const [uploadKML, setUploadKML] = useState('none');
  const [uploadGeoJSON, setUploadGeoJSON] = useState('none');

  // Default useeffect function
  useEffect(() => {
    geomType = aoiStatus;
  })

  // Change AOI function
  function changeAOI(event) {
    const value = event.target.value;

    // Set selected value of AOI
    setAoiStatus(value);

    // Delete all current AOI
    removeAoi(value);

    // Set upload section to hide
    setUploadSHP('none');
    setUploadGeoJSON('none');
    setUploadKML('none');

    if (Draw){
      Draw.remove();
    }

    switch (value) {
      case 'Shapefile (zip)':
        setUploadSHP('inline');
        break;
      case 'Draw AOI':
        Draw.addTo(Map);
        break;
      case 'GeoJSON':
        setUploadGeoJSON('inline');
        break;
      case 'KML':
        setUploadKML('inline');
        break;
    };
  }

  return (
    <div style={{ margin: '5% auto' }}>
      Select and AOI option

      <div>

        <Select
          items={['Draw AOI', 'Shapefile (zip)', 'KML', 'GeoJSON', 'Map bounds']} 
          onChange={changeAOI} 
          placeholder='Select AOI option'
          style={{ textAlign: 'center', width: '100%' }}
          selected={aoiStatus}
          className='action'
        />

      </div>

      <div style={{ width: '100%', margin: '3% auto' }}> 

        <SHPUploadSection className='action' style={{ display: uploadSHP }}/>
        <KMLUploadSection className='action' style={{ display: uploadKML }} />
        <GeoJSONUploadSection className='action' style={{ display: uploadGeoJSON }} />

      </div>

      <button 
        type='button'
        className='action'
        style={{ width: '100%', color: 'red', margin: '2% auto'}}
        onClick={removeAoi}
      >
          Remove AOI
      </button>

    </div>
  );
}

// SHP upload button
function SHPUploadSection(props){
	const [selectedFile, setSelectedFile] = useState();
	const [isFilePicked, setIsFilePicked] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    SHPFile = selectedFile;
  })

	const changeHandler = (event) => {
		setSelectedFile(event.target.files[0]);
		setIsFilePicked(true);
    setShowButton(false);
	};

	return(
   <div style={props.style}>

			<input 
        type="file" 
        name="file" 
        accept='.zip' 
        onChange={changeHandler}
        className='upload'
      />

        <button style={{ width: '100%' }} className={props.className} disabled={showButton} onClick={showSHP}>
          Show SHP to map
        </button>

		</div>
	)
}

// KML Upload section
function KMLUploadSection(props){
  const [selectedFile, setSelectedFile] = useState();
	const [isFilePicked, setIsFilePicked] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    KMLFile = selectedFile;
  })

	const changeHandler = (event) => {
		setSelectedFile(event.target.files[0]);
		setIsFilePicked(true);
    setShowButton(false);
	};

	return(
   <div style={props.style}>
			<input 
        type="file" 
        name="file" 
        accept='.kml,.kmz'
        onChange={changeHandler}
        className='upload'
      />

        <button style={{ width: '100%' }} className={props.className} disabled={showButton} onClick={showKML}>
          Show KML to map
        </button>

		</div>
	)
}

// KML Upload section
function GeoJSONUploadSection(props){
  const [selectedFile, setSelectedFile] = useState();
	const [isFilePicked, setIsFilePicked] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    GeoJSONFile = selectedFile;
  })

	const changeHandler = (event) => {
		setSelectedFile(event.target.files[0]);
		setIsFilePicked(true);
    setShowButton(false);
	};

	return(
   <div style={props.style} className={props.className}>
			<input 
        type="file" 
        name="file" 
        accept='.json,.geojson'
        onChange={changeHandler}
        className='upload'
      />

        <button style={{ width: '100%' }} className={props.className} disabled={showButton} onClick={showGeoJSON}>
          Show GeoJSON to map
        </button>

		</div>
	)
}

// Date filter
function DateSlider() {
  const currentDate = new Date();
  const ymd = currentDate.toISOString().split('T')[0];

  // Date range
  const [dateStart, setDateStart] = useState('2022-01-01');
  const [dateEnd, setDateEnd] = useState(ymd);

  function startChange(data){
    const status = data.target.value;
    setDateStart(status);
  }

  function endChange(data){
    const status = data.target.value;
    setDateEnd(status);
  }

  // Date check
  const [dateCheck, setCheck] = useState(true);

  // On change check function
  function checkChange(data){
    const status = data.target.checked;
    setCheck(status);

    if(status == true){
      setShow('inline');
    } else {
      setShow('none')
    }
  }

  // Show and hide calendar
  const [show, setShow] = useState('inline');

  // DOY
  const [doy1, setDoy1] = useState(1);
  const [doy2, setDoy2] = useState(365);
  const [max, setMax] = useState(365);
  const [min, setMin] = useState(1);

  function doyChange1(event) {
    const value = event.target.value;
    setDoy1(value);
    setMin(value);
  }
  function doyChange2(event) {
    const value = event.target.value;
    setDoy2(value);
    setMax(value);
    console.log(value);
  }

  useEffect(() => {
    if (dateCheck === false){
      startDate = '1970-01-01';
      endDate= ymd;
      dateRangePair = [1, 365];
    } else {
      startDate = dateStart;
      endDate= dateEnd;
      dateRangePair = [doy1, doy2]; 
    }
  })

  return (
    <div className='section'>

      <div>
        <Checkbox checked={dateCheck} onChange={checkChange} label='Date filter' />
      </div>

      <br />

      <div style={{ display: show }}>
        
        <div style={{ width: '100%', textAlign: 'justify' }} className='column'>

          <div style={{ marginRight: 'auto', width: '20%', textAlign: 'left' }}>
            Start
          </div>

          <div style={{ margin: 'auto', width: '60%', textAlign: 'center' }}>
            Date range
          </div>

          <div style={{ marginLeft: 'auto', width: '20%', textAlign: 'right'}}>
            End
          </div>

        </div>

        <div style={{ width: '100%' }} className='column'>

          <div style={{ marginRight: 'auto', textAlign: 'left', width: '100%' }}>
            <input type="date" value={dateStart} onChange={startChange} />
          </div>

          <div style={{ marginLeft: 'auto', textAlign: 'right', width: '100%' }}>
            <input type="date" value={dateEnd} onChange={endChange} />
          </div>

        </div>

        <br />

        <div style ={{ margin: 'auto', textAlign: 'center' }}>
            Day of year
        </div>

        <div className='column'>

          <div style={{ marginRight: 'auto', textAlign: 'left' }}>
            {doy1}
          </div>

          <div>
            <input type='range' min={1} max={max} style={{ width: '100%' }} value={doy1} onChange={doyChange1}/>
          </div>

          <div>
            <input type='range' min={min} max={365} style={{ width: '100%' }} value={doy2} onChange={doyChange2}/>
          </div>

          <div style={{ marginLeft: 'auto', textAlign: 'right'}}>
            {doy2}
          </div>

        </div>

      </div>
    </div>
  )
}

// Cloud filter section
function CloudSection(){
  const [cloud, setCloud] = useState(true);
  const [show, setShow] = useState('flex');

  function checkChange(data){
    const status = data.target.checked;
    setCloud(status);

    if(status == true){
      setShow('inline');
    } else {
      setShow('none')
    }
  }

  const [cloudPercent, setCloudPercent] = useState(50);

  function cloudPercentChange(data) {
    const status = data.target.value;
    setCloudPercent(status);
  }

  useEffect(() => {
    if(cloud === false){
      cloudFilter = 100;
    } else {
      cloudFilter = cloudPercent;
    }
  })

  return (
    <div className='section'>

      <div>
        <Checkbox checked={cloud} onChange={checkChange} label='Cloud filter' />
      </div>

      <div style={{ display: show, width: '100%' }}>

        <input type='range' style={{ width: '90%'}} value={cloudPercent} onChange={cloudPercentChange}/>
        <label htmlFor='cloudSlider'>{cloudPercent}</label>

      </div>

    </div>
  )
}

// Preprocessing section
function Preprocessing(){
  const [cloudMask, setCloudMask] = useState(true);

  function checkChange(data){
    const status = data.target.checked;
    setCloudMask(status);
  }

  useEffect(() => {
    cloudMasking = cloudMask;
  })

  return (
    <div className='section'>
      
      <div style={{ fontWeight: 'bold' }}>
        Preprocessing
      </div>

      <div>
        <Checkbox checked={cloudMask} onChange={checkChange} label='Cloud masking' />
      </div>

    </div>
  )
}

// Band visualization
function Visualization(){
  const [bands, setBands] = useState(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12']);
  const [red, setRed] = useState('B8');
  const [green, setGreen] = useState('B11');
  const [blue, setBlue] = useState('B2');

  function changeRed(data){
    const status = data.target.options[data.target.selectedIndex].text;
    setRed(status);
  }

  function changeGreen(data){
    const status = data.target.options[data.target.selectedIndex].text;
    setGreen(status);
  }

  function changeBlue(data){
    const status = data.target.options[data.target.selectedIndex].text;
    setBlue(status);
  }

  useEffect(() => {
    setBandsList = setBands;
    setBandRed = setRed;
    setBandGreen = setGreen;
    setBandBlue = setBlue;
    bandRed = red;
    bandGreen = green;
    bandBlue = blue;
  }, [red, green, blue]);

  return (
    <div className='section'>
      
      <div style={{ fontWeight: 'bold' }}>Visualization</div>
      
      <div className='column'>
        <div>
          <Select items={bands} placeholder='Select band' selected={red} onChange={changeRed} className='action' />
        </div>

        <div>
          <Select items={bands} placeholder='Select band' selected={green} onChange={changeGreen} className='action' />
        </div>

        <div>
          <Select items={bands} placeholder='Select band' selected={blue} onChange={changeBlue} className='action' />
        </div>
      </div>
    
    </div>
  )
}

// ** Components ** //


// ** Function ** //

// leafletMap
function leafletMap () {
	// Get current location
	window.navigator.geolocation ? 
		window.navigator.geolocation.getCurrentPosition(data => startMap({ lat: data.coords.latitude, lng: data.coords.longitude })) 
		: startMap({ lat: -7, lng: 110 });

	// Function to start map
	function startMap (center) {
		// Import leaflet draw package
		require('leaflet-draw');

		// Initialize Map
		Map = L.map('map', {
			center: center,
			zoom: 12,
			maxZoom: 15,
      minZoom: 3,
			zoomControl: false
		});

		// Basemap
		L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }).addTo(Map);

		// Data layer for AOI
		Data = L.geoJSON([], {
      style: {
        color: 'red'
      }
    }).addTo(Map);

		// Tile layer
		Tile = L.featureGroup().addTo(Map);

		// Create control draw
		Draw = new L.Control.Draw({
      edit: {
        featureGroup: Data,
      },
      draw: {
        marker: false,
        polyline: false,
        circlemarker: false
      }
    }).addTo(Map)
		
		// Event when draw is created
    Map.on('draw:created', event => {
      Data.addLayer(event.layer);
    });
  
		// Event when draw is deleted
    Map.on('draw:deleted', event => {
      if (Object.keys(Data.getLayers()).length) {
      } else {
      };
    });
	}
}

// Function to add image to map
function showImage(){
  // Delete click action
  clickValues(false);

  // Show loading indicator
  setLoadingScreen('block');

  // Disable image button
  showButtonStatus(true);

  // Delete all tile
  Tile.clearLayers();

  switch (geomType) {
    case 'Map bounds':
			try {
				const bounds = Map.getBounds();
				const polygon = turf.bboxPolygon([bounds.getEast(), bounds.getSouth(), bounds.getWest(), bounds.getNorth()]);
				const featureCol = turf.featureCollection([polygon]);
				eeDataFetch(featureCol);
			} catch (err) {
				alert(err);
			};
      break;
    default:
			try {
				eeDataFetch(Data);
			} catch (err) {
				alert(err);
			};
			break;
  }

  async function eeDataFetch(geojson){
    const options = {
      method: 'POST',
      body: JSON.stringify({
        imageCol,
        bandRed,
        bandGreen,
        bandBlue,
        geojson,
        startDate,
        endDate,
        dateRangePair,
        cloudFilter,
        cloudMasking,
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
		
		try {
			const response = await fetch('/api/image', options);
			const result = await response.json();
			console.log(result);
			eeTileToMap(result, geojson);
		} catch (err) {
			alert(err);
		};

    // Allow to remove tile
    showRemoveButton(false);

    // Remove AOI
    removeAoi();

    // Add listener to map
    clickValues(true);
  }
}

// EE tile to map
function eeTileToMap(data, geojson){
	// Import leaflet module
	const L = require('leaflet');

  // Create a new tile source to fetch visible tiles on demand and displays them on the map.
  const image = L.tileLayer(data.urlFormat).addTo(Tile);

	// Loading screen event
	Map.on('loading', () => {
		setLoadingScreen('block');
	});

	Map.on('load', () => {
		setLoadingScreen('none');
	});

  // Count
  const children = Number(document.getElementById('layerlist').childElementCount).toString();

  // Add info to layer panel
  const layerPanel = ReactDOM.createRoot(document.getElementById('layerlist'));
  layerPanel.render(<Info key={children} number={children} data={data} tile={image} aoi={geojson} />);

  // Show click to get value
  setValues('block');

  // Set image as global var
  Composite = data.image;
}

// Layers info
function Info(props){
  const image = props.tile;
  const aoi = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(props.aoi));

  const [check, setCheck] = useState(true);

  function onChange(event){
    const status = event.target.checked;
    setCheck(status);

    if(status == true){
      image.setOpacity(1);
    } else {
      image.setOpacity(0);
    }
  }

  return (
    <div style={{ border: '1px solid black', fontSize: 'small', width: '100%' }}>
      
      <div style={{ borderBottom: '1px solid black' }}>
        <Checkbox label={'Image' + ' ' + props.number} checked={check} onChange={onChange}/>
      </div>
      
      <div className='info'>
        Collection: {imageCol}
      </div>

      <div className='info'>
        Date: {startDate} - {endDate}
      </div>

      <div className='info'>
        DOY: {dateRangePair[0]} - {dateRangePair[1]}
      </div>

      <div className='info'>
        Cloud filter: {'<= ' + cloudFilter + '%'}
      </div>

      <div className='info'>
        Cloud masking: {cloudMasking.toString()}
      </div>

      <div className='info'>
        Visualization: {bandRed + '-' + bandGreen + '-' + bandBlue}
      </div>

      <div className='info'>
        Map ID: 
        <input type='text' value={props.data.mapid} readOnly={true} style={{ width: '100%' }} />
      </div>

      <div className='info'>
        XYZ tile:
        <input type='text' value={props.data.urlFormat} readOnly={true} style={{ width: '100%' }} />
      </div>

      <div className='info'>
        <OpenLink href={aoi} download='aoi.geojson'>
          <button style={{ width: '100%' }}>Download AOI</button>
        </OpenLink>
      </div>

    </div>
  )
}

// Set click function
function clickValues(status) {
  if (status === true){
		Map.on('click', async (event) => {
			const latlng = event.latlng;
			const options = {
        headers: {
          'Content-Type': 'application/json'
        }, 
        method: 'POST', 
        body: JSON.stringify({ point: latlng, image: Composite })
			}

			// Fetch image value
			try {
				const response = await fetch('/api/value', options);
				const result = await response.json();
				setShowChart('block');
        setDataChart(result);
			} catch (err) {
				alert(err)
			};

		})
  } else {
    Map.off('click');
  };
}

// Show SHP to map button
function showSHP(){
  const body = new FormData();
  body.append("file", SHPFile);

  let options = {
    method: 'POST',
    body: body
  };

	// Fetch geojson from shapefile
  fetch('/api/shp', options)
    .then(response => response.json())
    .then(geojson => toMap(geojson))
		.catch(err => alert(err));
}

// Show KML file to map
function showKML(){
  new Promise(resolve => resolve(KMLFile.text()))
    .then(text => new DOMParser().parseFromString(text, 'application/xml'))
    .then(xml => kml(xml))
    .then(geojson => toMap(geojson))
    .catch(err => alert(err))
}

// Show KML file to map
function showGeoJSON(){
  new Promise(resolve => resolve(GeoJSONFile.text()))
    .then(text => JSON.parse(text))
    .then(geojson => toMap(geojson))
    .catch(err => alert(err))
}

// Function to show added geo data to map
function toMap(geojson){
  // Delete current data on Map
  removeAoi();

  // Simplify geometries and delete unecessary data
  geojson.features.map(data => data.properties = null);
  let simplify = turf.simplify(geojson, {tolerance: 0.001, mutate: true});
  simplify = simplify.features.length > 1 ? simplify = turf.dissolve(simplify) : simplify;

  // Add json layer to Data
  L.geoJSON(simplify).addTo(Data);

	// Get feature centroid
	const centroid = turf.centroid(simplify).geometry.coordinates;

	// Center map to feature
	Map.setView({ lat: centroid[1], lng: centroid[0] }, 8, { animate: true });

  // Enable image button
  showButtonStatus(false);
}

// Remove all AOI function
function removeAoi(type=null) {
  if (type == 'Map bounds' || geomType == 'Map bounds'){
    showButtonStatus(false);
  } else {
    showButtonStatus(true);
  }

  // Remove every feature in Map
  Data.clearLayers();
}

// ** Function ** //