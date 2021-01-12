import { BuilderContext } from '@angular-devkit/architect';
import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { getSystemPath, normalize, workspaces } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import * as fs from 'fs';
import * as path from 'path';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

interface IncludeLibrary {
  name: string;
  assetsRoot: boolean;
}

interface IncludeAssets {
  libs: IncludeLibrary[];
}

function getWorkspace(context: BuilderContext): Promise<workspaces.WorkspaceDefinition> {
  return workspaces.readWorkspace(normalize(context.workspaceRoot), workspaces.createWorkspaceHost(new NodeJsSyncHost()), workspaces.WorkspaceFormat.JSON).then(v => v.workspace);
}

export function extendAssets(options: BrowserBuilderSchema, context: BuilderContext): Promise<BrowserBuilderSchema> {
  return from(getWorkspace(context))
    .pipe(
      map(workspace => {
        const projectName = context.target ? context.target.project : workspace.extensions['defaultProject'] as string;

        const projectRoot = normalize(workspace.projects.get(projectName).root);
        const includeFilePath = getSystemPath(normalize(path.join(projectRoot, normalize('src/assets/include.json'))));
        let newOptions = { ...options };

        if (fs.existsSync(includeFilePath)) {
          context.logger.info('Found include.json file, adding content to assets');
          try {
            const assets: IncludeAssets = JSON.parse(fs.readFileSync(includeFilePath, 'utf-8'));

            newOptions = {
              ...options,
              assets: options.assets.concat(
                assets.libs
                  .filter(library => {
                    if (!Array.from(workspace.projects.keys()).includes(library.name)) {
                      context.logger.warn(`WARN: A project named '${library.name}' does not exist in this workspace.`);
                      return false;
                    } else {
                      return true;
                    }
                  })
                  .map(library => {
                    const libraryRoot = workspace.projects.get(library.name).sourceRoot;
                    const subFolder = !library.assetsRoot ? `/${library.name}` : '';
                    context.logger.info(`Adding library ${library.name} (${libraryRoot}/assets -> ./assets${subFolder})`);
                    
                    return [
                      {
                        glob: '**/*',
                        input: `./${libraryRoot}/assets/i18n`,
                        output: `./assets/${library.name}/i18n`
                      },
                      {
                        glob: '**/*',
                        input: `./${libraryRoot}/assets`,
                        output: `./assets${subFolder}`,
                        ignore: ['i18n/**/*']
                      }
                    ];
                  })
                  .reduce((x, c) => x.concat(c), [])
              )
            };
          } catch (e) {
            context.logger.error(`The file ${includeFilePath} is incorrectly formatted.`);
            context.logger.error(e);
          }
        } else {
          context.logger.info('No include.json file found.');
        }
        return newOptions;
      })
    )
    .toPromise();
}
