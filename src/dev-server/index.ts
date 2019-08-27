import { createBuilder } from '@angular-devkit/architect';
import { serveWebpackBrowser } from '@angular-devkit/build-angular/src/dev-server';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { extendAssets } from '../utils/extend-assets';

function serveWebpackBrowserWithAssets(options, context, transforms?) {
  const getTargetOptions = context.getTargetOptions;
  context.getTargetOptions = browserTarget => {
    return from(getTargetOptions(browserTarget))
      .pipe(switchMap(targetOptions => extendAssets(targetOptions as any, context)))
      .toPromise();
  };
  return serveWebpackBrowser(options, context, transforms);
}

export default createBuilder(serveWebpackBrowserWithAssets);
