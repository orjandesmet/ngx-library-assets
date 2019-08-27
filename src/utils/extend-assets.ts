import { Schema as BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { experimental, getSystemPath, normalize, resolve, schema } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { Workspace } from '@angular-devkit/core/src/experimental/workspace';
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

function getWorkspace(context): Promise<Workspace> {
  const registry = new schema.CoreSchemaRegistry();
  registry.addPostTransform(schema.transforms.addUndefinedDefaults);

  return experimental.workspace.Workspace.fromPath(new NodeJsSyncHost(), normalize(context.workspaceRoot), registry);
}

export function extendAssets(options: BrowserBuilderSchema, context: any): Promise<BrowserBuilderSchema> {
  return from(getWorkspace(context))
    .pipe(
      map(workspace => {
        const projectName = context.target ? context.target.project : workspace.getDefaultProjectName();

        const projectRoot = resolve(workspace.root, normalize(workspace.getProject(projectName).root));
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
                    if (!workspace.listProjectNames().includes(library.name)) {
                      context.logger.warn(`WARN: A project named '${library.name}' does not exist in this workspace.`);
                      return false;
                    } else {
                      return true;
                    }
                  })
                  .map(library => {
                    const libraryRoot = workspace.getProject(library.name).sourceRoot;
                    context.logger.info(`Adding library ${library.name} (${libraryRoot})`);
                    
                    return [
                      {
                        glob: '**/*',
                        input: `./${libraryRoot}/assets/i18n`,
                        output: `./assets/${library.name}/i18n`
                      },
                      {
                        glob: '**/*',
                        input: `./${libraryRoot}/assets`,
                        output: `./assets/${!library.assetsRoot ? library.name : ''}`,
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
