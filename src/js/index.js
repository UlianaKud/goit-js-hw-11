import { PixabayAPI } from './pixabay-api';
import { renderImagesList } from './renderImageList';

import Notiflix from 'notiflix';
import 'simplelightbox/dist/simple-lightbox.min.css';
import SimpleLightbox from 'simplelightbox';

const searchFormEl = document.querySelector('.search-form');
const galleryList = document.querySelector('.gallery');

const pixabayApi = new PixabayAPI();
let gallery;
let isLoading = false;

document.addEventListener('scroll', () => {
  const { height } = galleryList.getBoundingClientRect();

  if (height - window.pageYOffset < 1000 && !isLoading) {
    onLoadMore();
  }
});

const onSearchFormSubmit = async event => {
  event.preventDefault();
  pixabayApi.page = 1;

  const searchQuery = event.currentTarget.elements['searchQuery'].value;
  pixabayApi.q = searchQuery;
  if (!searchQuery?.trim()) {
    galleryList.innerHTML = '';
    Notiflix.Notify.failure('Oops, request is empty');
    return;
  }

  try {
    const { data } = await pixabayApi.fetchPhotos();
    if (!data.hits?.length) {
      galleryList.innerHTML = '';
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    galleryList.innerHTML = renderImagesList(data.hits);
    gallery = new SimpleLightbox('.gallery a');

    Notiflix.Notify.success(`"Hooray! We found ${data.totalHits} images.`);
  } catch (err) {
    console.log(err);
  }
};

const onLoadMore = async () => {
  pixabayApi.page += 1;

  try {
    isLoading = true;
    const { data } = await pixabayApi.fetchPhotos();
    if (pixabayApi.page * pixabayApi.per_page >= data.totalHits) {
      return;
    }
    galleryList.insertAdjacentHTML('beforeend', renderImagesList(data.hits));
    isLoading = false;
    gallery.refresh();
    const { height } = document
      .querySelector('.gallery')
      .firstElementChild.getBoundingClientRect();
    window.scrollBy({
      top: height * 2,
      behavior: 'smooth',
    });
  } catch (err) {
    isLoading = false;
    console.log(err);
  }
};

searchFormEl.addEventListener('submit', onSearchFormSubmit);
