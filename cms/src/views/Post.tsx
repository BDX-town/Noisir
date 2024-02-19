import React from 'react';
import { Button, TextInput, useTranslations, createUseStyles } from '@bdxtown/canaille';
import {MDXEditor, headingsPlugin, toolbarPlugin, markdownShortcutPlugin, BlockTypeSelect, BoldItalicUnderlineToggles, UndoRedo, linkDialogPlugin, CreateLink, imagePlugin, MDXEditorMethods, listsPlugin, linkPlugin, quotePlugin  } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css'
import { IconBookUpload, IconTrash, IconBook2 } from '@tabler/icons-react'
import fr from './Post.fr-FR.i18n.json';
import { useAppContext } from '../data/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from './../bits/Loader';
import { Modal } from '../bits/Modal';
import { Post as IPost } from '../types/Post';
import { slugify } from './../helpers/slugify';
import { formatPost } from '../helpers/formatPost';
import { ImageUploader } from './../bits/ImageUploader';
import { useUpload } from '../bits/ButtonUpload';
import debounce from 'debounce';
import { weight as calculateWeight } from './../helpers/weight'

import { MediaInput } from '../bits/MediaInput';

const DeleteModal = ({ onCancel, post }: { onCancel: React.MouseEventHandler, post: IPost }) => {
    const { actions } = useAppContext();
    const { deletePost } = actions;
    const { T } = useTranslations('Post', {'fr-FR': fr});

    const navigate = useNavigate();

    const onConfirm = React.useCallback(async () => {
        // TODO: feedback
        const result = await deletePost(post);
        console.log(result);
        navigate('/');
    }, [deletePost, navigate, post]);

    return (
        <Modal className='bg-additional-primary' onClose={onCancel}>
            <T>shouldDelete</T>
            <div className='mt-3 flex justify-between items-center gap-4'>
                <Button size={50} className='bg-red-500' onClick={onConfirm}>
                    <IconTrash /> <T>confirm</T>
                </Button>
                <Button size={50} onClick={onCancel}>
                    <IconBook2 /> <T>cancel</T>
                </Button>
            </div>
        </Modal>
    );
}


  
const useStyle = createUseStyles({
    editorCSS: {
        "&>.mdxeditor-toolbar": {
            marginLeft: "-32px",
            marginRight: "-32px",

            paddingLeft: "32px",
            paddingRight: "32px",
        }
    } as React.CSSProperties
})


export const Post = ({ blank = false }: { blank?: boolean }) => {
    const param = useParams();
    const filename = param.file;
    const { posts, blog, actions } = useAppContext();
    const { editPost } = actions;
    const post = React.useMemo(() => {
        return posts?.find((p) => p.file === filename);
    }, [filename, posts]);
    const { __, T } = useTranslations('Post', {'fr-FR': fr});
    const editor = React.useRef<MDXEditorMethods>(null);
    const [shouldDelete, setShouldDelete] = React.useState(false);
    const upload = useUpload();
    const editorWrapper = React.useRef<HTMLDivElement>(null);
    const [imageWeight, setImageWeight] = React.useState(0);

    const [weight, setWeight] = React.useState(post ? new TextEncoder().encode(formatPost(post)).length : 0);

    const { editorCSS } = useStyle();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const calculateImageWeight = React.useCallback(debounce(async () => {
        if(!editorWrapper.current) return;
        const sources = [
            post?.cover,
            ...(Array.from(editorWrapper.current.querySelectorAll('img')) as HTMLImageElement[]).map((r) => r.currentSrc)
        ].filter((r) => (!!r)) as string[];
        const imgRequest = Array.from(new Set(sources))
            .map((r) => fetch(r).then((f) => f.text()));
        const imgSizes = await Promise.all(imgRequest);
        setImageWeight(imgSizes.reduce((acc, curr) => acc += curr.length, 0));
    }, 500), []);

    React.useEffect(() => {
        calculateImageWeight();
    }, [calculateImageWeight]);

    const onChange: React.KeyboardEventHandler<HTMLFormElement> = React.useCallback((e) => {
        const formData: Partial<IPost> = Array.from(new FormData(e.currentTarget as HTMLFormElement)
            .entries())
            .reduce((acc, curr) => ({...acc, [curr[0]]: curr[1]}), {});
        const data: IPost = {
            ...post,
            ...formData,
            file: post?.file || `${slugify(formData.title as string)}-${new Date().getTime()}.md`,
            content: editor.current?.getMarkdown()
        } as IPost

        const weight = new TextEncoder().encode(formatPost(data)).length;
        setWeight(weight);
        calculateImageWeight();
    }, [calculateImageWeight, post]);


    const onSubmit: React.FormEventHandler = React.useCallback(async (e) => {
        e.preventDefault();
        if(!editor.current || !blog || (!blank && !post)) return;
        const formData: Partial<IPost> = Array.from(new FormData(e.currentTarget as HTMLFormElement)
            .entries())
            .reduce((acc, curr) => ({...acc, [curr[0]]: curr[1]}), {});
        const data: IPost = {
            ...post,
            ...formData,
            file: post?.file || `${slugify(formData.title as string)}-${new Date().getTime()}.md`,
            content: editor.current?.getMarkdown(),
            updatedAt: new Date(),
            weight,
        } as IPost
        // TODO: feedback
        const result = await editPost(data);
        console.log(result);
    }, [blank, blog, editPost, post, weight]);

    if(!post && !blank) return (
        <div className='grow flex flex-col items-center justify-center'>
            <Loader />
        </div>
    );

    return (
        <>
            <form className="grow mt-5 flex flex-col gap-4" onSubmit={onSubmit} onKeyUp={onChange}>
                <div className='px-5 flex flex-col gap-4'>
                    <div className='flex gap-3 items-center'>
                        <div className='grow flex flex-col justify-between gap-4'>
                            <TextInput required name="title" label={__('title')} defaultValue={post?.title} />
                            <TextInput required name="description" label={__('description')} defaultValue={post?.description} />
                        </div>
                        <MediaInput className='h-[110px]' required name="cover" label={__('cover')} defaultValue={post?.cover}>
                            <T>cover</T>
                        </MediaInput>
                    </div>
                </div>
                <div ref={editorWrapper}>
                    <MDXEditor 
                        className={`${editorCSS} grow border-solid border-0 border-t-2 border-b-2  border-grey-100 bg-white text-[22px] leading-[135%] px-5`}
                        contentEditableClassName='min-h-[450px]'
                        markdown={post?.content as string || ""} 
                        ref={editor}
                        plugins={[
                            headingsPlugin(),
                            listsPlugin(),
                            linkPlugin(),
                            quotePlugin(),
                            markdownShortcutPlugin(),
                            linkDialogPlugin(),
                            imagePlugin({ 
                                imageUploadHandler: upload
                            }),
                            toolbarPlugin({
                                toolbarContents: () => (
                                    <>
                                        <UndoRedo />
                                        <BlockTypeSelect />
                                        <BoldItalicUnderlineToggles />
                                        <CreateLink />
                                        <ImageUploader onPick={calculateImageWeight} />
                                    </>
                                )
                            }),
                        ]} 
                    />
                </div>
                <div className='flex justify-between px-5 pb-5'>
                    {
                        !blank ? (
                            <Button variant='secondary' onClick={() => setShouldDelete(true)}>
                                <IconTrash /> <T>delete</T>
                            </Button>
                        ) : (
                            <span className='opacity-0'></span>
                        )
                    }
                    <div className='flex gap-3 items-center'>
                        <div>
                            <T weight={calculateWeight(weight + imageWeight)}>for-reader</T>
                        </div>
                        <Button size={50} htmlType='submit'>
                            <IconBookUpload /> <T>publish</T>
                        </Button>
                    </div>

                </div>
            </form>
            {
                shouldDelete && <DeleteModal post={post as IPost} onCancel={() => setShouldDelete(false)} />
            }
        </>
    )
}