import React from 'react';
import { useAppContext } from '../data/AppContext';
import { TextInput, useTranslations } from '@bdxtown/canaille';
import {MDXEditor, toolbarPlugin, markdownShortcutPlugin, BlockTypeSelect, BoldItalicUnderlineToggles, UndoRedo, linkDialogPlugin, CreateLink, MDXEditorMethods, listsPlugin, linkPlugin, quotePlugin  } from '@mdxeditor/editor';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Blog as IBlog } from 'types/src/Blog';

import { MediaInput } from '../bits/MediaInput';

import fr from './Blog.fr-FR.i18n.json';
import { AppError } from '../data/AppError';
import { EDIT_BLOG_DENY, EDIT_BLOG_FAIL } from '../services/blogs';
import { ButtonProcess } from '../bits/ButtonProcess';
import { Loader } from '../bits/Loader';


const Blog = () => {
    const { blog, actions, media } = useAppContext();
    const { editBlog } = actions;
    const { __, T} = useTranslations('Blog', { 'fr-FR': fr });
    const editor = React.useRef<MDXEditorMethods>(null);

    const [processing, setProcessing] = React.useState(false);
    const [error, setError] = React.useState<AppError | undefined>(undefined);
    const [success, setSuccess] = React.useState<string | undefined>(undefined)

    const onSubmit: React.FormEventHandler<HTMLFormElement> = React.useCallback(async (e) => {
        e.preventDefault();
        if(!editor.current) return;
        const formData: Partial<IBlog> = Array.from(new FormData(e.currentTarget as HTMLFormElement)
            .entries())
            .reduce((acc, curr) => ({...acc, [curr[0]]: curr[1]}), {});

        const data: IBlog = {
            ...blog,
            ...formData,
            blogDescription: editor.current.getMarkdown(),
        };
        setProcessing(true);
        try {
            const result = await editBlog(data);
            if(result) setSuccess(__('success'))
            else setSuccess(__('queued'));
        } catch (e) {
            const appError = e as AppError;
            // we do not handle EDIT_BLOG_FALSE since the case shouldnt appear. 
            // If it's the case, there is an issue with the server configuration or the code base
            if(appError.code === EDIT_BLOG_FAIL || appError.code === EDIT_BLOG_DENY) setError(appError);
            else throw e;
        } finally {
            setProcessing(false);
        }
    }, [__, blog, editBlog]);

    if(!blog || !media) {
        return (
            <div className='grow flex items-center justify-center'>
                <Loader />
            </div>
        )
    }

    return (
        <form className="p-5" onSubmit={onSubmit}>
            <div className='flex gap-4'>
                <div className='flex flex-col gap-1 w-[300px]'>
                    <div className='flex flex-col w-full gap-4'>
                        <div>
                            <TextInput className='grow' name="blogName" label={__('title')} defaultValue={blog.blogName} required />
                        </div>
                        <div>
                            <TextInput className='grow' name="fediverse" label={__('fediverse')} pattern='@\w+@\w+\.\w+' placeholder={__('fediverse-placeholder')} defaultValue={blog.fediverse} />
                            <div className='text-right'>
                                <a className='text-xs' href="https://blog.joinmastodon.org/2024/07/highlighting-journalism-on-mastodon/" target='_blank'><T>placeholder-more</T></a>
                            </div>
                        </div>
                    </div>
                    <div className='h-full flex flex-col items-start'>
                        <label className='[box-shadow:-1px_2px_0px_0px_#070727] bg-brand-primary py-1 px-2 mb-2 rounded-lg border-solid border-grey-100 border-[1px] text-[0.75rem]'><T>cover-label</T></label>
                        <MediaInput className='h-[200px] grow' label={__('cover')} name="blogCover" required defaultValue={blog.blogCover}>
                            <T>cover</T>
                        </MediaInput>
                    </div>
    
                </div>
                <div className='grow flex flex-col items-start gap-2'>
                    <label className='[box-shadow:-1px_2px_0px_0px_#070727] z-10 bg-brand-primary py-1 px-2 rounded-lg border-solid border-grey-100 border-[1px] text-[0.75rem]'><T>description</T></label>
                    <MDXEditor 
                        className='w-full h-full border-solid border-2 border-grey-100 rounded-2xl overflow-hidden bg-white' 
                        markdown={blog.blogDescription} 
                        ref={editor}
                        plugins={[
                            listsPlugin(),
                            linkPlugin(),
                            quotePlugin(),
                            markdownShortcutPlugin(),
                            linkDialogPlugin(),
                            toolbarPlugin({
                                toolbarContents: () => (
                                <>
                                    {' '}
                                    <UndoRedo />
                                    <BlockTypeSelect />
                                    <BoldItalicUnderlineToggles />
                                    <CreateLink />
                                </>
                                )
                            }),
                            markdownShortcutPlugin()
                        ]} 
                    />
                </div>
            </div>
            <div className='flex justify-end gap-3 items-center mt-3'>
                <ButtonProcess processing={processing} success={success} error={error} size={50} htmlType="submit">
                    <IconDeviceFloppy /> <T>publish</T>
                </ButtonProcess>
            </div>
        </form>
    )
}

export default Blog;