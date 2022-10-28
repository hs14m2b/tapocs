import {get as http_get} from 'http'
import {get as https_get} from 'https'

export async function getContent(url) {
    // return new pending promise
    return new Promise((resolve, reject) => {
      // select http or https module, depending on reqested url
      const get_func = url.startsWith('https') ? https_get : http_get;
      const request = get_func(url, (response) => {
        // handle http errors
        if (response.statusCode < 200 || response.statusCode > 299) {
           reject(new Error('Failed to load page, status code: ' + response.statusCode));
         }
        // temporary data holder
        const body = [];
        // on every content chunk, push it to the data array
        response.on('data', (chunk) => body.push(chunk));
        // we are done, resolve promise with those joined chunks
        response.on('end', () => resolve(body.join('')));
      });
      // handle connection errors of the request
      request.on('error', (err) => reject(err))
      })
  };

export async function getHeaders(url) {
    // return new pending promise
    return new Promise((resolve, reject) => {
      // select http or https module, depending on reqested url
      const get_func = url.startsWith('https') ? https_get : http_get;
      const request = get_func(url, (response) => {
        // handle http errors
        if (response.statusCode < 300 || response.statusCode > 499) {
           reject(new Error('Failed to load page, status code: ' + response.statusCode));
        }
        else {
          resolve(response.headers);
        }
      });
      // handle connection errors of the request
      request.on('error', (err) => reject(err))
      })
  };
