import { createBuilder } from '@angular-devkit/architect';
import { buildWebpackBrowser } from '@angular-devkit/build-angular/src/browser';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { extendAssets } from '../utils/extend-assets';

function buildWebpackBrowserWithAssets(options, context: any, transforms?: any) {
  return from(extendAssets(options, context)).pipe(
    switchMap(extendedOptions => buildWebpackBrowser(extendedOptions, context, transforms))
  );
}

export default createBuilder(buildWebpackBrowserWithAssets);
