'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export interface PaginationControlI {
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  currentPage: number;
}

const Pagination = ({ itemsPerPage, totalItems, onPageChange, currentPage }: PaginationControlI) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Generate an array of page numbers
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
  };

  return (
    <nav aria-label="Pagination navigation">
      <ul className="pagination-list" style={{ display: 'flex', listStyle: 'none', gap: '8px' }}>
        {currentPage!==1 && (<li>
          <Link href="#" aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Go to previous page"
          >Предыдущая</Link>
        </li>)}

        {pageNumbers.map(number => (
          <li key={number}>
            <Link href="#" aria-disabled={currentPage === number} tabIndex={currentPage === number ? -1 : undefined}
              onClick={() => goToPage(number)}
              // Radix pattern uses data-state attributes for styling
              data-state={currentPage === number ? 'active' : 'inactive'}
              aria-current={currentPage === number ? 'page' : undefined}
              className={currentPage === number ? 'active-page' : ''}
            >{number}</Link>
          </li>
        ))}

        {currentPage!==totalPages && (<li>
          <Link href="#" aria-disabled={currentPage === totalPages} tabIndex={currentPage === totalPages ? -1 : undefined}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Go to next page"
          >Следующая</Link>
        </li>)}
      </ul>
    </nav>
  );
};

export interface PaginationAppI {
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  activePage: number;
}

export const PaginationApp = ({ itemsPerPage, totalItems, onPageChange, activePage }: PaginationAppI) => {
  const [currentPage, setCurrentPage] = useState(activePage);

  console.log('PaginationApp itemsPerPage', itemsPerPage)
  console.log('PaginationApp totalItems', totalItems)
  console.log('PaginationApp activePage', activePage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange(page)
    // In a real application, you would fetch data for the new page here
    console.log(`Fetching data for page ${page}`);
  };

  if(itemsPerPage >= totalItems) return (<></>)

  return (
    <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        currentPage={currentPage}
    />
  );
};