import { Component, ElementRef, Inject, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { LocationData } from '../../providers/location-data';
import { Platform, AlertController } from '@ionic/angular';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-map',
  templateUrl: 'map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnInit {
  @ViewChild('mapCanvas', { static: true }) mapElement: ElementRef;
  selectLocation = true;

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    public locationData: LocationData,
    public platform: Platform,
    private route: ActivatedRoute,
    public alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectLocation = params['selectLocation'];
      if (this.selectLocation) {
        this.alertLocationSelection();
      }
    });
  }

  /**
   * Sets the location of the user's preference for voting
   * @param markerData - the location to set as the voting place
   */
  setLocation(markerData: any) {
    if (this.selectLocation) {
      console.log(markerData);
    }
  }

  async alertLocationSelection() {
    const alert = await this.alertCtrl.create({
      header: 'Select Location',
      buttons: ['Ok'],
      message: 'Please pick the location at which you want to vote'
    });
    await alert.present();
  }

  async ngAfterViewInit() {
    const appEl = this.doc.querySelector('ion-app');
    let style = [];

    const googleMaps = await getGoogleMaps('AIzaSyDAvyXeJn1MTe5NsoKxSwBTufnavgn4AWI');

    let map: any;

    this.locationData.getMap().subscribe((mapData: any) => {
      const mapEle = this.mapElement.nativeElement;

      map = new googleMaps.Map(mapEle, {
        zoom: 14,
        styles: style
      });

      // Add a marker for each location
      mapData.forEach((markerData: any) => {
        const infoWindow = new googleMaps.InfoWindow({
          content: `<h5>${markerData.name}</h5>`
        });

        const marker = new googleMaps.Marker({
          position: markerData,
          map,
          title: markerData.name
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          this.setLocation(markerData);
        });
      });

      // Zoom the map on the user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setCenter(pos);
          },
          () => {
            console.error('Error with getting current location');
          }
        );
      } else {
        // Browser doesn't support Geolocation
        console.error('Error with getting current location');
      }

      googleMaps.event.addListenerOnce(map, 'idle', () => {
        mapEle.classList.add('show-map');
      });
    });

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          const el = mutation.target as HTMLElement;
          if (map) {
            map.setOptions({ styles: [] });
          }
        }
      });
    });
    observer.observe(appEl, {
      attributes: true
    });
  }
}

function getGoogleMaps(apiKey: string): Promise<any> {
  const win = window as any;
  const googleModule = win.google;
  if (googleModule && googleModule.maps) {
    return Promise.resolve(googleModule.maps);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      const googleModule2 = win.google;
      if (googleModule2 && googleModule2.maps) {
        resolve(googleModule2.maps);
      } else {
        reject('google maps not available');
      }
    };
  });
}
