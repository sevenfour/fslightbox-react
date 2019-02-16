import React from 'react';
import { FsLightboxMock } from "../../__mocks__/components/fsLightboxMock";
import { getMountedImageForFsLightboxInstance } from "../../__mocks__/helpers/getMountedImageForFsLightboxInstance";
import { mount } from "enzyme";
import Image from "../../../src/components/sources/properSources/Image";
import Video from "../../../src/components/sources/properSources/Video";
import { SourceSizeAdjuster } from "../../../src/core/Source/SourceSizeAdjuster";

describe('Source Size', () => {
    const mock = new FsLightboxMock();
    const fsLightbox = mock.getWrapper();
    const fsLightboxInstance = mock.getInstance();
    getMountedImageForFsLightboxInstance(fsLightboxInstance);
    const sourceInstance = fsLightbox.find('Source').at(0).instance();
    sourceInstance.sourceWasCreated();

    it('should adjust source size initially', () => {
        fsLightboxInstance.sourceDimensions[0] = {
            width: 2000,
            height: 2000
        };
        fsLightboxInstance.maxSourceWidth = 1500;
        fsLightboxInstance.maxSourceHeight = 1500;

        sourceInstance.onFirstSourceLoad();
        expect(fsLightboxInstance.elements.sources[0].current.style.width)
            .toEqual(1500 + 'px');
        expect(fsLightboxInstance.elements.sources[0].current.style.height)
            .toEqual(1500 + 'px');
    });
});


describe('Actions after first source load', () => {
    const mock = new FsLightboxMock();
    const fsLightbox = mock.getWrapper();
    const fsLightboxInstance = mock.getInstance();

    describe('Image', () => {
        const sourceInstance = fsLightbox.find('Source').at(0).instance();
        const image = mount(<Image
            _={ fsLightboxInstance }
            i={ 0 }
            onFirstSourceLoad={ sourceInstance.onFirstSourceLoad }
        />);
        const mockedEvent = {
            target: {
                width: 1920,
                height: 1080
            }
        };
        sourceInstance.onSourceLoad = jest.fn();
        image.simulate('load', mockedEvent);

        it('should add dimensions to array', () => {
            expect(fsLightboxInstance.sourceDimensions[0]).toEqual({
                width: 1920,
                height: 1080
            });
        });

        it('should create Source Size Adjuster', () => {
            expect(fsLightboxInstance.sourceSizeAdjusters[0]).toBeInstanceOf(SourceSizeAdjuster);
        });

        it('should call onFirstSourceLoad from props', () => {
            expect(sourceInstance.onSourceLoad).toBeCalled();
        });

        it('should not call onFirstSourceLoad after previosly open', () => {
            sourceInstance.onFirstSourceLoad = jest.fn();
            image.simulate('load', mockedEvent);
            expect(sourceInstance.onFirstSourceLoad).not.toBeCalled();
        });
    });

    describe('Video', () => {
        const sourceInstance = fsLightbox.find('Source').at(1).instance();
        const video = mount(<Video
            _={ fsLightboxInstance }
            i={ 1 }
            onFirstSourceLoad={ sourceInstance.onFirstSourceLoad }
        />);
        const mockedEvent = {
            target: {
                videoWidth: 1366,
                videoHeight: 768,
            }
        };

        sourceInstance.onSourceLoad = jest.fn();
        sourceInstance.createSourceSizeAdjuster = jest.fn();
        video.simulate('loadedmetadata', mockedEvent);
        it('should add dimensions to array', () => {
            expect(fsLightboxInstance.sourceDimensions[1]).toEqual({
                width: 1366,
                height: 768
            });
        });

        it('should create Source Size Adjuster', () => {
            expect(fsLightboxInstance.sourceSizeAdjusters[0]).toBeInstanceOf(SourceSizeAdjuster);
        });

        it('should call onFirstSourceLoad from props', () => {
            expect(sourceInstance.onSourceLoad).toBeCalled();
        });

        it('should not call onFirstSourceLoad after previosly open', () => {
            sourceInstance.onFirstSourceLoad = jest.fn();
            video.simulate('loadedmetadata', mockedEvent);
            expect(sourceInstance.onFirstSourceLoad).not.toBeCalled();
        });
    });
});